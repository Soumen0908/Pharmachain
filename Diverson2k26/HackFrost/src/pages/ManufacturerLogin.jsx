import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { sendOTP, verifyOTP } from '../services/api';
import { Mail, Lock, User, Phone, LogIn, UserPlus, ShieldCheck, Factory, ArrowRight, Upload, FileCheck, Building2, CreditCard, BadgeCheck, KeyRound, RefreshCw, Heart } from 'lucide-react';
import './CustomerLogin.css';
import './ManufacturerLogin.css';

export default function ManufacturerLogin() {
    const [mode, setMode] = useState('signin');
    const [step, setStep] = useState('form'); // 'form' | 'otp'
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        companyName: '', licenseNumber: '', govtIdProof: '',
    });
    const [otp, setOtp] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [otpSending, setOtpSending] = useState(false);
    const { login, loginVerify, signup, error, setError } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    async function handleSendOTP() {
        if (!form.email) { toast.error('Enter your email first'); return; }
        if (!form.companyName || !form.licenseNumber) {
            toast.error('Company name and license number are required');
            return;
        }
        setOtpSending(true);
        try {
            await sendOTP(form.email);
            toast.success('OTP sent to your email! Check your inbox.');
            setStep('otp');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setOtpSending(false);
        }
    }

    async function handleVerifyAndSignup() {
        if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
        setSubmitting(true);
        setError('');
        try {
            await verifyOTP(form.email, otp);
            toast.success('Email verified!');
            await signup({ ...form, role: 'manufacturer' });
            toast.success('Manufacturer account created!');
            setTimeout(() => navigate('/manufacturer'), 800);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleSignIn(e) {
        e.preventDefault();
        if (step === 'otp') {
            // Step 2: verify login OTP
            if (!otp || otp.length !== 6) { toast.error('Enter the 6-digit OTP'); return; }
            setSubmitting(true);
            setError('');
            try {
                await loginVerify(form.email, otp, 'manufacturer');
                toast.success('Welcome back!');
                setTimeout(() => navigate('/manufacturer'), 800);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setSubmitting(false);
            }
            return;
        }
        // Step 1: password check → triggers OTP email
        setSubmitting(true);
        setError('');
        try {
            const data = await login(form.email, form.password, 'manufacturer');
            if (data.requireOTP) {
                toast.success('OTP sent to your email! Check your inbox.');
                setStep('otp');
                setOtp('');
            } else {
                toast.success('Welcome back!');
                setTimeout(() => navigate('/manufacturer'), 800);
            }
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleResendLoginOTP() {
        setOtpSending(true);
        try {
            await login(form.email, form.password, 'manufacturer');
            toast.success('New OTP sent to your email!');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setOtpSending(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        if (mode === 'signin') {
            handleSignIn(e);
        } else {
            if (step === 'form') {
                if (!form.name || !form.email || !form.password) {
                    toast.error('Fill in all required fields');
                    return;
                }
                await handleSendOTP();
            } else {
                await handleVerifyAndSignup();
            }
        }
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, govtIdProof: file.name });
            toast.info(`Selected: ${file.name}`);
        }
    }

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    return (
        <div className="auth-page manufacturer-auth">
            <div className="auth-page-bg">
                <div className="auth-orb auth-orb-1"></div>
                <div className="auth-orb auth-orb-2"></div>
            </div>

            <div className="auth-page-content">
                <div className="auth-hero-side">
                    <div className="auth-hero-badge mfg-badge">
                        <Factory size={16} /> Manufacturer Portal
                    </div>
                    <h1 className="auth-hero-title">
                        Protect Your<br />
                        <span className="gradient-text">Brand Integrity.</span>
                    </h1>
                    <p className="auth-hero-desc">
                        Register medicine batches on-chain, generate QR codes, and build consumer trust through blockchain verification.
                    </p>
                    <div className="auth-trust-badges">
                        <div className="auth-trust-item"><BadgeCheck size={20} /><span>Govt ID Verified</span></div>
                        <div className="auth-trust-item"><ShieldCheck size={20} /><span>On-Chain Registration</span></div>
                    </div>
                </div>

                <div className="auth-form-side">
                    <div className="auth-card glass-card">
                        <div className="auth-card-header">
                            <h2>{mode === 'signin' ? (step === 'otp' ? 'Verify Login' : 'Manufacturer Login') : (step === 'otp' ? 'Verify Email' : 'Register Manufacturer')}</h2>
                            <p>{mode === 'signin' ? (step === 'otp' ? `Enter the OTP sent to ${form.email}` : 'Access your manufacturer dashboard') : (step === 'otp' ? `Enter the OTP sent to ${form.email}` : 'Create your manufacturer account')}</p>
                        </div>

                        <div className="auth-tabs">
                            <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setStep('form'); }}>
                                <LogIn size={15} /> Sign In
                            </button>
                            <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setStep('form'); }}>
                                <UserPlus size={15} /> Register
                            </button>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <form className="auth-form" onSubmit={handleSubmit}>
                            {step === 'otp' ? (
                                <>
                                    <div className="otp-display">
                                        <KeyRound size={32} className="otp-icon" />
                                        <p className="otp-info">We sent a 6-digit code to <strong>{form.email}</strong></p>
                                    </div>
                                    <div className="auth-field">
                                        <label><KeyRound size={14} /> Verification Code</label>
                                        <input type="text" placeholder="Enter 6-digit OTP" value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            maxLength={6} required
                                            style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '6px', fontWeight: 700 }} />
                                    </div>
                                    <button type="button" className="auth-resend-btn" onClick={mode === 'signin' ? handleResendLoginOTP : handleSendOTP} disabled={otpSending}>
                                        <RefreshCw size={13} /> {otpSending ? 'Sending...' : 'Resend OTP'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    {mode === 'signup' && (
                                        <div className="auth-field">
                                            <label><User size={14} /> Full Name</label>
                                            <input type="text" placeholder="Your full name" value={form.name} onChange={set('name')} required />
                                        </div>
                                    )}
                                    <div className="auth-field">
                                        <label><Mail size={14} /> Email</label>
                                        <input type="email" placeholder="company@example.com" value={form.email} onChange={set('email')} required />
                                    </div>
                                    <div className="auth-field">
                                        <label><Lock size={14} /> Password</label>
                                        <input type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required minLength={6} />
                                    </div>
                                    {mode === 'signup' && (
                                        <>
                                            <div className="auth-field">
                                                <label><Building2 size={14} /> Company Name *</label>
                                                <input type="text" placeholder="e.g. Cipla Ltd" value={form.companyName} onChange={set('companyName')} required />
                                            </div>
                                            <div className="auth-field">
                                                <label><CreditCard size={14} /> Drug License Number *</label>
                                                <input type="text" placeholder="e.g. DL-MH-2026-0001" value={form.licenseNumber} onChange={set('licenseNumber')} required />
                                            </div>
                                            <div className="auth-field">
                                                <label><Upload size={14} /> Govt ID Proof</label>
                                                <div className="file-upload-area">
                                                    <input type="file" accept="image/*,.pdf" onChange={handleFileChange} id="govtIdFile" />
                                                    <label htmlFor="govtIdFile" className="file-upload-label">
                                                        {form.govtIdProof ? <><FileCheck size={14} /> {form.govtIdProof}</> : <><Upload size={14} /> Upload Document</>}
                                                    </label>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </>
                            )}

                            <button type="submit" className="btn btn-primary auth-submit" disabled={submitting || otpSending}>
                                {submitting ? <span className="spinner-sm"></span> : (
                                    mode === 'signin' ? (
                                        step === 'otp' ? <><ShieldCheck size={16} /> Verify &amp; Sign In</> : <><LogIn size={16} /> Sign In</>
                                    ) : (
                                        step === 'otp' ? <><ShieldCheck size={16} /> Verify &amp; Register</> : <><Mail size={16} /> Send Verification Code</>
                                    )
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>
                                {mode === 'signin' ? "Don't have an account? " : 'Already registered? '}
                                <button className="auth-switch" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setStep('form'); setError(''); }}>
                                    {mode === 'signin' ? 'Register' : 'Sign In'}
                                </button>
                            </p>
                        </div>

                        <div className="auth-divider"><span>or</span></div>

                        <Link to="/login/customer" className="auth-alt-link">
                            <Heart size={16} />
                            I'm a Customer
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
