const express = require('express');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const db = require('../db');

const router = express.Router();

// ── Email transporter — Real Gmail SMTP ──
const GMAIL_USER = process.env.GMAIL_USER || 'soumajitgoswami4@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || 'zqam hydt pxcd nrep';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
    },
});

// Verify on startup
transporter.verify()
    .then(() => console.log('📧 Gmail SMTP ready — real OTP emails enabled'))
    .catch(err => console.error('📧 Gmail SMTP error:', err.message));

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// ── Send OTP ──
router.post('/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Store OTP
    db.deleteOne('otps', o => o.email === email); // remove old
    db.insertOne('otps', { email, otp, expiresAt, verified: false });

    // Send email
    try {
        await transporter.sendMail({
            from: `"PharmaChain" <${GMAIL_USER}>`,
            to: email,
            subject: '🔐 PharmaChain — Your Verification Code',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0f;color:#e2e8f0;border-radius:16px;">
                    <h1 style="color:#06b6d4;font-size:24px;margin-bottom:8px;">PharmaChain</h1>
                    <p style="color:#94a3b8;margin-bottom:24px;">Your email verification code</p>
                    <div style="background:#1e293b;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
                        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#06b6d4;">${otp}</span>
                    </div>
                    <p style="color:#64748b;font-size:13px;">This code expires in 10 minutes. Do not share it with anyone.</p>
                    <hr style="border:none;border-top:1px solid #1e293b;margin:24px 0;" />
                    <p style="color:#475569;font-size:11px;">If you didn't request this code, please ignore this email.</p>
                </div>
            `,
        });
        console.log(`📧 OTP sent to ${email}`);
        res.json({ success: true, message: 'OTP sent to your email' });
    } catch (err) {
        console.error('Email send error:', err);
        // Fallback: still store OTP, tell user to retry
        res.status(500).json({ error: 'Failed to send OTP email. Please try again.' });
    }
});

// ── Verify OTP ──
router.post('/verify-otp', (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const record = db.findOne('otps', o => o.email === email);
    if (!record) return res.status(400).json({ error: 'No OTP found. Request a new one.' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP expired. Request a new one.' });
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP. Please try again.' });

    // Mark as verified
    db.updateOne('otps', o => o.email === email, { verified: true });

    // If user exists, mark email as verified
    const user = db.findOne('users', u => u.email === email);
    if (user) {
        db.updateOne('users', u => u.email === email, { emailVerified: true });
    }

    res.json({ success: true, message: 'Email verified successfully' });
});

// ── Sign Up (now requires OTP verification first) ──
router.post('/signup', (req, res) => {
    const { email, password, name, phone, role, companyName, licenseNumber, govtIdProof } = req.body;

    if (!email || !password || !name || !role) {
        return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }
    if (!['customer', 'manufacturer'].includes(role)) {
        return res.status(400).json({ error: 'Role must be customer or manufacturer' });
    }

    // Check OTP verification
    const otpRecord = db.findOne('otps', o => o.email === email && o.verified === true);
    if (!otpRecord) {
        return res.status(400).json({ error: 'Please verify your email with OTP first' });
    }

    // Check if user exists
    const existing = db.findOne('users', u => u.email === email);
    if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Manufacturer validation
    if (role === 'manufacturer' && (!companyName || !licenseNumber)) {
        return res.status(400).json({ error: 'Company name and license number are required for manufacturers' });
    }

    const user = {
        id: uuidv4(),
        email,
        password,
        name,
        phone: phone || '',
        role,
        address: '',
        avatar: '',
        emailVerified: true,
        companyName: role === 'manufacturer' ? (companyName || '') : '',
        licenseNumber: role === 'manufacturer' ? (licenseNumber || '') : '',
        govtIdProof: role === 'manufacturer' ? (govtIdProof || '') : '',
        govtIdVerified: false,
        savedMedicines: [],
        searchHistory: [],
        expiryAlerts: [],
        preferences: { notifications: true, darkMode: true, language: 'en' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    db.insertOne('users', user);

    // Clean up OTP
    db.deleteOne('otps', o => o.email === email);

    // Create session token
    const token = uuidv4();
    db.insertOne('sessions', { token, userId: user.id, createdAt: new Date().toISOString() });

    const { password: _, ...safeUser } = user;
    res.status(201).json({ token, user: safeUser });
});

// ── Login (Step 1: password check → send OTP) ──
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = db.findOne('users', u => u.email === email && u.password === password);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (role && user.role !== role) {
        return res.status(401).json({ error: `This account is registered as a ${user.role}, not a ${role}` });
    }

    // Send OTP for login verification
    const otp = generateOTP();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    db.deleteOne('otps', o => o.email === email);
    db.insertOne('otps', { email, otp, expiresAt, verified: false, purpose: 'login' });

    try {
        await transporter.sendMail({
            from: `"PharmaChain" <${GMAIL_USER}>`,
            to: email,
            subject: '🔐 PharmaChain — Login Verification Code',
            html: `
                <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0a0a0f;color:#e2e8f0;border-radius:16px;">
                    <h1 style="color:#06b6d4;font-size:24px;margin-bottom:8px;">PharmaChain</h1>
                    <p style="color:#94a3b8;margin-bottom:24px;">Login verification code</p>
                    <div style="background:#1e293b;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
                        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#06b6d4;">${otp}</span>
                    </div>
                    <p style="color:#64748b;font-size:13px;">This code expires in 10 minutes. If you didn't try to log in, change your password immediately.</p>
                </div>
            `,
        });
        console.log(`📧 Login OTP sent to ${email}`);
    } catch (err) {
        console.error('Login OTP email error:', err);
    }

    res.json({ requireOTP: true, message: 'OTP sent to your email for login verification', email });
});

// ── Login (Step 2: verify OTP → create session) ──
router.post('/login-verify', (req, res) => {
    const { email, otp, role } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    const record = db.findOne('otps', o => o.email === email);
    if (!record) return res.status(400).json({ error: 'No OTP found. Request a new one.' });
    if (Date.now() > record.expiresAt) return res.status(400).json({ error: 'OTP expired. Try logging in again.' });
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP. Please try again.' });

    // OTP valid — find user and create session
    const user = db.findOne('users', u => u.email === email);
    if (!user) return res.status(401).json({ error: 'User not found' });

    if (role && user.role !== role) {
        return res.status(401).json({ error: `This account is registered as a ${user.role}, not a ${role}` });
    }

    // Clean up OTP
    db.deleteOne('otps', o => o.email === email);

    // Create session
    const token = uuidv4();
    db.insertOne('sessions', { token, userId: user.id, createdAt: new Date().toISOString() });

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
});

// ── Logout ──
router.post('/logout', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
        db.deleteOne('sessions', s => s.token === token);
    }
    res.json({ message: 'Logged out' });
});

// ── Get Current User ──
router.get('/me', (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const session = db.findOne('sessions', s => s.token === token);
    if (!session) return res.status(401).json({ error: 'Session expired' });

    const user = db.findOne('users', u => u.id === session.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    const { password: _, ...safeUser } = user;
    res.json({ user: safeUser });
});

module.exports = router;
