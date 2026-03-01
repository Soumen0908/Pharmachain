require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const reportRoutes = require('./routes/reports');
const medicineRoutes = require('./routes/medicines');
const blockchainRoutes = require('./routes/blockchain');
const geminiRoutes = require('./routes/gemini');
const liveRoutes = require('./routes/live');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || true; // true = reflect origin (dev mode)
app.use(cors({ origin: ALLOWED_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/gemini', geminiRoutes);
app.use('/api/live', liveRoutes);

// RPC proxy — lets the frontend (and MetaMask) reach the Hardhat node through the API
app.post('/rpc', async (req, res) => {
    try {
        const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
        });
        const data = await response.json();
        res.json(data);
    } catch (err) {
        res.status(502).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Blockchain node unreachable' }, id: req.body?.id || null });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error-handling middleware
app.use((err, req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// ── Serve frontend static files (production) ──
const distPath = path.join(__dirname, '..', 'dist');
const fs = require('fs');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    // SPA fallback — serve index.html for any non-API route
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/rpc')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
    console.log('📁 Serving frontend from dist/');
}

app.listen(PORT, () => {
    console.log(`✅ PharmaChain API server running on http://localhost:${PORT}`);
});
