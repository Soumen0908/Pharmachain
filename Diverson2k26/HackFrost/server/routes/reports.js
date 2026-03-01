const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// POST /api/reports — Report a fake medicine
router.post('/', (req, res) => {
    const { batchId, reason, location, description, reporterEmail } = req.body;

    if (!batchId || !reason) {
        return res.status(400).json({ error: 'Batch ID and reason are required' });
    }

    const report = {
        id: uuidv4(),
        batchId,
        reason,
        location: location || '',
        description: description || '',
        reporterEmail: reporterEmail || 'anonymous',
        status: 'pending',
        createdAt: new Date().toISOString(),
    };

    db.insertOne('reports', report);
    res.status(201).json({ report, message: 'Report submitted successfully. Thank you for helping keep medicines safe.' });
});

// GET /api/reports — Get all reports (for admin/analytics)
router.get('/', (req, res) => {
    const reports = db.findAll('reports');
    res.json({ reports });
});

// GET /api/reports/batch/:batchId — Check if a batch has been reported
router.get('/batch/:batchId', (req, res) => {
    const reports = db.findAll('reports', r => r.batchId === req.params.batchId);
    res.json({ reports, flagged: reports.length > 0 });
});

module.exports = router;
