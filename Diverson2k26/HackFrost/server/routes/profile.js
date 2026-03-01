const express = require('express');
const db = require('../db');

const router = express.Router();

// Middleware to get current user from token
function getUser(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const session = db.findOne('sessions', s => s.token === token);
    if (!session) return res.status(401).json({ error: 'Session expired' });

    const user = db.findOne('users', u => u.id === session.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
}

// GET /api/profile
router.get('/', getUser, (req, res) => {
    const { password: _, ...safeUser } = req.user;
    res.json({ user: safeUser });
});

// PUT /api/profile
router.put('/', getUser, (req, res) => {
    const { name, phone, address, companyName, licenseNumber, govtIdProof, preferences } = req.body;

    const updates = { updatedAt: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (address !== undefined) updates.address = address;
    if (preferences !== undefined) updates.preferences = { ...req.user.preferences, ...preferences };

    // Manufacturer-specific fields
    if (req.user.role === 'manufacturer') {
        if (companyName !== undefined) updates.companyName = companyName;
        if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
        if (govtIdProof !== undefined) {
            updates.govtIdProof = govtIdProof;
            updates.govtIdVerified = false; // Reset verification when new ID uploaded
        }
    }

    const updated = db.updateOne('users', u => u.id === req.user.id, updates);
    if (!updated) return res.status(500).json({ error: 'Failed to update profile' });

    const { password: _, ...safeUser } = updated;
    res.json({ user: safeUser, message: 'Profile updated successfully' });
});

// POST /api/profile/verify-id (simulate govt ID verification)
router.post('/verify-id', getUser, (req, res) => {
    if (req.user.role !== 'manufacturer') {
        return res.status(403).json({ error: 'Only manufacturers can verify govt ID' });
    }
    if (!req.user.govtIdProof) {
        return res.status(400).json({ error: 'Please upload a government ID first' });
    }

    // Simulate verification (auto-approve for demo)
    const updated = db.updateOne('users', u => u.id === req.user.id, {
        govtIdVerified: true,
        updatedAt: new Date().toISOString(),
    });

    const { password: _, ...safeUser } = updated;
    res.json({ user: safeUser, message: 'Government ID verified successfully' });
});

// POST /api/profile/saved-medicines
router.post('/saved-medicines', getUser, (req, res) => {
    const { medicine } = req.body;
    if (!medicine) return res.status(400).json({ error: 'Medicine data is required' });

    const savedMedicines = [...(req.user.savedMedicines || [])];
    // Avoid duplicates
    if (!savedMedicines.find(m => m.name === medicine.name)) {
        savedMedicines.push({ ...medicine, savedAt: new Date().toISOString() });
    }

    db.updateOne('users', u => u.id === req.user.id, { savedMedicines, updatedAt: new Date().toISOString() });
    res.json({ savedMedicines, message: 'Medicine saved to profile' });
});

// DELETE /api/profile/saved-medicines/:name
router.delete('/saved-medicines/:name', getUser, (req, res) => {
    const savedMedicines = (req.user.savedMedicines || []).filter(m => m.name !== req.params.name);
    db.updateOne('users', u => u.id === req.user.id, { savedMedicines, updatedAt: new Date().toISOString() });
    res.json({ savedMedicines, message: 'Medicine removed from profile' });
});

// POST /api/profile/search-history
router.post('/search-history', getUser, (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ error: 'Search query is required' });

    const searchHistory = [...(req.user.searchHistory || [])];
    // Keep last 20, avoid duplicates at top
    const filtered = searchHistory.filter(s => s.query !== query);
    filtered.unshift({ query, searchedAt: new Date().toISOString() });
    const trimmed = filtered.slice(0, 20);

    db.updateOne('users', u => u.id === req.user.id, { searchHistory: trimmed, updatedAt: new Date().toISOString() });
    res.json({ searchHistory: trimmed });
});

// GET /api/profile/search-history
router.get('/search-history', getUser, (req, res) => {
    res.json({ searchHistory: req.user.searchHistory || [] });
});

// POST /api/profile/expiry-alerts
router.post('/expiry-alerts', getUser, (req, res) => {
    const { batchId, medicineName, expiryDate } = req.body;
    if (!batchId || !expiryDate) return res.status(400).json({ error: 'Batch ID and expiry date are required' });

    const expiryAlerts = [...(req.user.expiryAlerts || [])];
    if (!expiryAlerts.find(a => a.batchId === batchId)) {
        expiryAlerts.push({ batchId, medicineName, expiryDate, createdAt: new Date().toISOString() });
    }

    db.updateOne('users', u => u.id === req.user.id, { expiryAlerts, updatedAt: new Date().toISOString() });
    res.json({ expiryAlerts, message: 'Expiry alert set' });
});

module.exports = router;
