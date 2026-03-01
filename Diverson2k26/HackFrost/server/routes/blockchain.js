/**
 * Blockchain API Routes — /api/blockchain/
 * Connects Express backend to PharmaChain smart contract
 */
const express = require('express');
const { ethers } = require('ethers');
const crypto = require('crypto');
const QRCode = require('qrcode');
const db = require('../db');
const blockchain = require('../services/blockchain');
const { generateScratchCode, generateQRPayload } = require('../utils/qrGenerator');
const { addEvent } = require('./live');
const {
    saveBatchRegistration,
    saveTransactionHistory,
    saveScratchActivation,
    getBatchHistory,
    getRecentTransfers,
} = require('../services/supabase');

const router = express.Router();

// ── Auth middleware (reuse existing session-based auth) ──
function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const session = db.findOne('sessions', s => s.token === token);
    if (!session) return res.status(401).json({ error: 'Session expired' });
    const user = db.findOne('users', u => u.id === session.userId);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
}

function requireManufacturer(req, res, next) {
    if (req.user.role !== 'manufacturer') {
        return res.status(403).json({ error: 'Only manufacturers can perform this action' });
    }
    next();
}

// ══════════════════════════════════════════════
// MANUFACTURER ROUTES (require auth)
// ══════════════════════════════════════════════

/**
 * POST /api/blockchain/batch/register
 * Register a new batch on the blockchain
 */
router.post('/batch/register', requireAuth, requireManufacturer, async (req, res) => {
    try {
        const {
            medicineName, batchNumber, composition, dosageForm,
            mfgDate, expiryDate, quantity, mrp, manufacturerName
        } = req.body;

        if (!medicineName || !batchNumber || !composition || !mfgDate || !expiryDate || !quantity) {
            return res.status(400).json({ error: 'All fields are required: medicineName, batchNumber, composition, mfgDate, expiryDate, quantity' });
        }

        // Check if batch number already used
        const existingBatch = db.findOne('batch_metadata', b => b.batchNumber === batchNumber);
        if (existingBatch) {
            return res.status(409).json({ error: 'Batch number already registered' });
        }

        // Generate hashes
        const batchIdHash = blockchain.hashBatchId(batchNumber);
        const scratchCode = generateScratchCode();
        const scratchCodeHash = blockchain.hashScratchCode(scratchCode);

        const metadata = {
            medicineName,
            batchNumber,
            composition,
            dosageForm: dosageForm || 'Tablet',
            mfgDate,
            expiryDate,
            quantity: Number(quantity),
            mrp: Number(mrp) || 0,
            manufacturerName: manufacturerName || req.user.companyName || req.user.name,
        };
        const metadataHash = blockchain.hashMetadata(metadata);

        // Get Hardhat account for manufacturer (account index 1 = manufacturer in seed)
        const provider = blockchain.getProvider();
        const manufacturerSigner = await provider.getSigner(1);

        // Generate QR code data (use manufacturerAddress, not userId, to match verifyQRHash)
        const { qrHash, payload, salt } = generateQRPayload(batchIdHash, batchNumber, manufacturerSigner.address);
        const config = blockchain.loadConfig();
        const contract = new ethers.Contract(config.address, config.abi, manufacturerSigner);

        // Call smart contract
        const tx = await contract.createBatch(batchIdHash, metadataHash, scratchCodeHash);
        const receipt = await tx.wait();

        // Store metadata locally (blockchain only stores hashes)
        const batchRecord = {
            id: batchIdHash,
            ...metadata,
            scratchCode,
            qrHash,
            qrPayload: payload,
            qrSalt: salt,
            userId: req.user.id,
            manufacturerAddress: manufacturerSigner.address,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            createdAt: new Date().toISOString(),
        };
        db.insertOne('batch_metadata', batchRecord);

        // Persist to Supabase (non-blocking)
        saveBatchRegistration(batchRecord).catch(e => console.error('Supabase batch save failed:', e.message));

        // Broadcast real-time event
        addEvent('batch-registered', {
            batchNumber, medicineName, manufacturer: req.user.companyName || req.user.name,
            quantity: metadata.quantity, mfgDate: metadata.mfgDate, expiryDate: metadata.expiryDate,
            txHash: receipt.hash,
        });

        res.status(201).json({
            success: true,
            message: 'Batch registered on blockchain',
            batch: {
                batchId: batchIdHash,
                batchNumber,
                medicineName,
                scratchCode,
                qrHash,
                qrPayload: payload,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
            },
        });
    } catch (err) {
        console.error('Batch registration error:', err.message);
        if (err.message.includes('Batch already exists')) {
            return res.status(409).json({ error: 'This batch is already registered on the blockchain' });
        }
        res.status(500).json({ error: 'Failed to register batch', details: err.message });
    }
});

/**
 * GET /api/blockchain/batch/my-batches
 * Get all batches registered by the logged-in manufacturer
 */
router.get('/batch/my-batches', requireAuth, requireManufacturer, async (req, res) => {
    try {
        const batches = db.findAll('batch_metadata', b => b.userId === req.user.id);

        // Enrich with blockchain status
        const contract = blockchain.getContract();
        const enriched = [];

        for (const batch of batches) {
            try {
                const details = await contract.getBatchDetails(batch.id);
                const formatted = blockchain.formatBatch(details);
                enriched.push({ ...batch, blockchain: formatted });
            } catch {
                enriched.push({ ...batch, blockchain: null });
            }
        }

        res.json({ batches: enriched });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch batches', details: err.message });
    }
});

/**
 * POST /api/blockchain/batch/:batchNumber/update-supply-chain
 * Add a supply chain step (transfer to distributor/retailer)
 */
/**
 * GET /api/blockchain/transfer-batches
 * List ALL batches enriched with on-chain status (for Transfer page)
 */
router.get('/transfer-batches', requireAuth, async (req, res) => {
    try {
        const allBatches = db.findAll('batch_metadata');
        const contract = blockchain.getContract();
        const enriched = [];

        for (const batch of allBatches) {
            let blockchainData = null;
            let supplyChain = [];
            try {
                const details = await contract.getBatchDetails(batch.id);
                blockchainData = blockchain.formatBatch(details);
                const history = await contract.getBatchHistory(batch.id);
                supplyChain = history.map(blockchain.formatTransferRecord);
            } catch { /* batch may not exist on chain */ }

            enriched.push({
                batchNumber: batch.batchNumber,
                medicineName: batch.medicineName,
                batchIdHash: batch.id,
                manufacturer: blockchainData?.manufacturer || batch.manufacturerAddress,
                currentHolder: blockchainData?.currentHolder || batch.manufacturerAddress,
                status: blockchainData?.statusCode ?? 0,
                statusText: blockchainData?.status || 'Manufactured',
                recalled: blockchainData?.recalled || false,
                inspectorApproved: blockchainData?.inspectorApproved || false,
                activated: blockchainData?.activated || false,
                supplyChain,
            });
        }

        res.json({ batches: enriched });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch transfer batches', details: err.message });
    }
});

router.post('/batch/:batchNumber/update-supply-chain', requireAuth, async (req, res) => {
    return res.status(410).json({
        error: 'Direct supply-chain updates are disabled. All transfers must go through the QR-based flow.',
        hint: 'Use POST /api/blockchain/transfer-qr/generate to create a transfer QR, or POST /api/blockchain/transfer-qr/auto-transfer / execute-action to execute one.',
    });
});

// ══════════════════════════════════════════════
// QR-BASED TRANSFER ROUTES
// ══════════════════════════════════════════════

/** Determine the next supply-chain action for a batch status + role */
function nextAction(status, role) {
    const MAP = {
        'manufacturer-0': 'transferToDistributor',
        'distributor-1':  'acknowledgeByDistributor',
        'distributor-2':  'transferToRetailer',
        'retailer-3':     'acknowledgeByRetailer',
        'inspector-4':    'inspectAndApprove',
        // Inspector can also flag at non-terminal statuses
        'inspector-0': 'flagBatch',
        'inspector-1': 'flagBatch',
        'inspector-2': 'flagBatch',
        'inspector-3': 'flagBatch',
    };
    return MAP[`${role}-${status}`] || null;
}

/** Determine the recipient address (next role) based on action */
function defaultRecipient(action, accounts) {
    if (action === 'transferToDistributor') return accounts[2].address; // distributor
    if (action === 'transferToRetailer')    return accounts[3].address; // retailer
    return null;
}

/**
 * POST /api/blockchain/transfer-qr/generate
 * Sender generates a unique QR code for a specific batch transfer.
 * Body: { batchNumber, location }
 * Returns: { qrToken, qrDataUrl, expiresAt, action }
 */
router.post('/transfer-qr/generate', requireAuth, async (req, res) => {
    try {
        const { batchNumber, location } = req.body;
        if (!batchNumber || !location) {
            return res.status(400).json({ error: 'batchNumber and location are required' });
        }

        // Look up batch
        const batch = db.findOne('batch_metadata', b => b.batchNumber === batchNumber);
        if (!batch) return res.status(404).json({ error: 'Batch not found' });

        // Get on-chain status
        const contract = blockchain.getContract();
        const details = await contract.getBatchDetails(batch.id);
        const status = Number(details[4]);

        // Determine action
        const action = nextAction(status, req.user.role);
        if (!action) {
            return res.status(400).json({ error: `No transfer action available for role "${req.user.role}" at status ${status}` });
        }

        // Generate a unique one-time token
        const qrToken = crypto.randomBytes(24).toString('hex');
        const expiresAt = Date.now() + 15 * 60 * 1000; // 15 min

        // Store token in local DB
        db.insertOne('transfer_qr_tokens', {
            qrToken,
            batchNumber,
            batchIdHash: batch.id,
            action,
            location,
            senderRole: req.user.role,
            senderEmail: req.user.email,
            createdAt: new Date().toISOString(),
            expiresAt,
            used: false,
        });

        // Build QR payload
        const qrPayload = JSON.stringify({
            t: 'pharmachain-transfer',
            token: qrToken,
            batch: batchNumber,
            action,
            loc: location,
            exp: expiresAt,
        });

        // Generate QR data URL (base64 PNG)
        const qrDataUrl = await QRCode.toDataURL(qrPayload, {
            width: 400,
            margin: 2,
            color: { dark: '#0f172a', light: '#ffffff' },
            errorCorrectionLevel: 'H',
        });

        res.json({
            success: true,
            qrToken,
            qrDataUrl,
            qrPayload,
            action,
            batchNumber,
            location,
            expiresAt,
        });
    } catch (err) {
        console.error('QR generate error:', err.message);
        res.status(500).json({ error: 'Failed to generate transfer QR', details: err.message });
    }
});

/**
 * POST /api/blockchain/transfer-qr/scan
 * Receiver scans / uploads the QR code to execute the transfer on-chain.
 * Body: { qrPayload }  — the JSON string decoded from the QR image
 * Returns: { success, txHash, newStatus, ... }
 */
router.post('/transfer-qr/scan', requireAuth, async (req, res) => {
    try {
        const { qrPayload } = req.body;
        if (!qrPayload) {
            return res.status(400).json({ error: 'qrPayload is required' });
        }

        // Parse & validate
        let parsed;
        try { parsed = JSON.parse(qrPayload); } catch {
            return res.status(400).json({ error: 'Invalid QR data — could not parse JSON' });
        }

        if (parsed.t !== 'pharmachain-transfer') {
            return res.status(400).json({ error: 'This QR code is not a PharmaChain transfer QR' });
        }

        // Look up token
        const record = db.findOne('transfer_qr_tokens', t => t.qrToken === parsed.token);
        if (!record) {
            return res.status(400).json({ error: 'Invalid or unknown transfer token' });
        }
        if (record.used) {
            return res.status(400).json({ error: 'This transfer QR has already been used' });
        }
        if (Date.now() > record.expiresAt) {
            return res.status(400).json({ error: 'Transfer QR has expired. Please request a new one.' });
        }

        // Execute blockchain transfer
        const { batchNumber, batchIdHash, action, location } = record;
        const provider = blockchain.getProvider();
        const config = blockchain.loadConfig();

        let signerIndex;
        switch (action) {
            case 'transferToDistributor':    signerIndex = 1; break;
            case 'acknowledgeByDistributor': signerIndex = 2; break;
            case 'transferToRetailer':       signerIndex = 2; break;
            case 'acknowledgeByRetailer':    signerIndex = 3; break;
            case 'inspectAndApprove':        signerIndex = 4; break;
            case 'flagBatch':                signerIndex = 4; break;
            default: return res.status(400).json({ error: 'Invalid action in QR token' });
        }

        const signer = await provider.getSigner(signerIndex);
        const contract = new ethers.Contract(config.address, config.abi, signer);
        const accounts = await provider.listAccounts();

        let tx;
        switch (action) {
            case 'transferToDistributor':
                tx = await contract.transferToDistributor(batchIdHash, defaultRecipient(action, accounts), location);
                break;
            case 'acknowledgeByDistributor':
                tx = await contract.acknowledgeByDistributor(batchIdHash, location);
                break;
            case 'transferToRetailer':
                tx = await contract.transferToRetailer(batchIdHash, defaultRecipient(action, accounts), location);
                break;
            case 'acknowledgeByRetailer':
                tx = await contract.acknowledgeByRetailer(batchIdHash, location);
                break;
            case 'inspectAndApprove':
                tx = await contract.inspectAndApprove(batchIdHash);
                break;
            case 'flagBatch':
                tx = await contract.flagBatch(batchIdHash);
                break;
        }

        const receipt = await tx.wait();

        // Mark QR token as used
        db.updateOne('transfer_qr_tokens', t => t.qrToken === record.qrToken, { used: true, usedAt: new Date().toISOString(), usedBy: req.user.email });

        // Persist transfer to Supabase
        const batch = db.findOne('batch_metadata', b => b.batchNumber === batchNumber);
        saveTransactionHistory({
            batchNumber,
            batchIdHash,
            medicineName: batch?.medicineName || null,
            action,
            location,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            signerIndex,
            timestamp: new Date().toISOString(),
        }).catch(e => console.error('Supabase transfer save failed:', e.message));

        // Broadcast real-time event
        addEvent('batch-transferred', { batchNumber, action, location, txHash: receipt.hash, viaQR: true });

        res.json({
            success: true,
            action,
            batchNumber,
            location,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
        });
    } catch (err) {
        console.error('QR scan transfer error:', err.message);
        res.status(500).json({ error: 'Transfer failed', details: err.message });
    }
});

/**
 * GET /api/blockchain/transfer-qr/pending
 * Get all pending (unused, non-expired) QR tokens for the logged-in user
 */
router.get('/transfer-qr/pending', requireAuth, async (req, res) => {
    try {
        const tokens = db.findAll('transfer_qr_tokens', t =>
            t.senderEmail === req.user.email && !t.used && t.expiresAt > Date.now()
        );
        res.json({ tokens });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch pending QRs', details: err.message });
    }
});

/**
 * POST /api/blockchain/transfer-qr/auto-transfer
 * Execute the next supply-chain transfer automatically based on the batch's current on-chain status.
 * Used when the receiver uploads a Verification QR (verify URL) instead of a transfer-token QR.
 * Body: { batchNumber, location }
 */
router.post('/transfer-qr/auto-transfer', requireAuth, async (req, res) => {
    try {
        const { batchNumber, location = 'On-site verification' } = req.body;
        if (!batchNumber) return res.status(400).json({ error: 'batchNumber is required' });

        // Find batch in local metadata
        const batch = db.findOne('batch_metadata', b => b.batchNumber === batchNumber);
        if (!batch) return res.status(404).json({ error: `Batch "${batchNumber}" not found in database` });

        const provider = blockchain.getProvider();
        const config = blockchain.loadConfig();
        const accounts = await provider.listAccounts();
        const readContract = blockchain.getContract();

        // Get current on-chain status
        const details = await readContract.getBatchDetails(batch.id);
        const status = Number(details[4]);

        // Map current status → { action, signerIndex, recipient }
        const STATUS_MAP = {
            0: { action: 'transferToDistributor',    signerIndex: 1, recipient: accounts[2].address },
            1: { action: 'acknowledgeByDistributor', signerIndex: 2, recipient: null },
            2: { action: 'transferToRetailer',       signerIndex: 2, recipient: accounts[3].address },
            3: { action: 'acknowledgeByRetailer',    signerIndex: 3, recipient: null },
            4: { action: 'inspectAndApprove',        signerIndex: 4, recipient: null },
        };

        const step = STATUS_MAP[status];
        if (!step) {
            return res.status(400).json({
                error: `Batch "${batchNumber}" is at status ${status} — no further auto-transfer is possible`,
                currentStatus: status,
            });
        }

        const { action, signerIndex, recipient } = step;
        const batchIdHash = batch.id;

        const signer = await provider.getSigner(signerIndex);
        const signedContract = new ethers.Contract(config.address, config.abi, signer);

        let tx;
        switch (action) {
            case 'transferToDistributor':
                tx = await signedContract.transferToDistributor(batchIdHash, recipient, location);
                break;
            case 'acknowledgeByDistributor':
                tx = await signedContract.acknowledgeByDistributor(batchIdHash, location);
                break;
            case 'transferToRetailer':
                tx = await signedContract.transferToRetailer(batchIdHash, recipient, location);
                break;
            case 'acknowledgeByRetailer':
                tx = await signedContract.acknowledgeByRetailer(batchIdHash, location);
                break;
            case 'inspectAndApprove':
                tx = await signedContract.inspectAndApprove(batchIdHash, location);
                break;
            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        const receipt = await tx.wait();

        // Persist to Supabase
        saveTransactionHistory({
            batchNumber,
            batchIdHash,
            medicineName: batch?.medicineName || null,
            action,
            location,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            signerIndex,
            timestamp: new Date().toISOString(),
        }).catch(e => console.error('Supabase auto-transfer save failed:', e.message));

        addEvent('batch-transferred', { batchNumber, action, location, txHash: receipt.hash, viaVerifyQR: true });

        res.json({
            success: true,
            batchNumber,
            action,
            location,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            prevStatus: status,
            newStatus: status + 1,
        });
    } catch (err) {
        console.error('Auto-transfer error:', err.message);
        res.status(500).json({ error: 'Auto-transfer failed', details: err.message });
    }
});

/**
 * POST /api/blockchain/transfer-qr/execute-action
 * Execute an inspector-generated pharmachain-action QR payload.
 * Body: { qrPayload: string }  (the JSON string encoded in the QR)
 */
router.post('/transfer-qr/execute-action', async (req, res) => {
    try {
        const { qrPayload } = req.body;
        if (!qrPayload) return res.status(400).json({ error: 'qrPayload is required' });

        let payload;
        try { payload = JSON.parse(qrPayload); } catch {
            return res.status(400).json({ error: 'Invalid QR payload: not valid JSON' });
        }

        if (payload.t !== 'pharmachain-action') {
            return res.status(400).json({ error: 'Not a pharmachain-action QR' });
        }

        const { action, batch: batchNumber, batchHash, recallReason, ts } = payload;

        const VALID_ACTIONS = ['inspectAndApprove', 'flagBatch', 'recallBatch'];
        if (!VALID_ACTIONS.includes(action)) {
            return res.status(400).json({ error: `Unknown inspector action: ${action}` });
        }

        // Freshness check (QR valid for 10 minutes)
        if (ts && Date.now() - ts > 10 * 60 * 1000) {
            return res.status(410).json({ error: 'This action QR has expired. Please generate a new one.' });
        }

        const provider = blockchain.getProvider();
        const config   = blockchain.loadConfig();
        const signer   = await provider.getSigner(4); // inspector account
        const contract = new ethers.Contract(config.address, config.abi, signer);

        const batchIdHash = batchHash || blockchain.hashBatchId(batchNumber);

        let tx;
        switch (action) {
            case 'inspectAndApprove':
                tx = await contract.inspectAndApprove(batchIdHash);
                break;
            case 'flagBatch':
                tx = await contract.flagBatch(batchIdHash);
                break;
            case 'recallBatch':
                if (!recallReason) return res.status(400).json({ error: 'recallReason required for recallBatch' });
                tx = await contract.recallBatch(batchIdHash, recallReason);
                break;
        }

        const receipt = await tx.wait();

        // Persist
        const batchMeta = db.findOne('batch_metadata', b => b.batchNumber === batchNumber);
        saveTransactionHistory({
            batchNumber,
            batchIdHash,
            medicineName: batchMeta?.medicineName || null,
            action,
            location: 'Inspector QR',
            txHash:      receipt.hash,
            blockNumber: receipt.blockNumber,
            signerIndex: 4,
            timestamp:   new Date().toISOString(),
        }).catch(e => console.error('Supabase execute-action save failed:', e.message));

        addEvent('batch-transferred', { batchNumber, action, txHash: receipt.hash });

        res.json({ success: true, action, batchNumber, txHash: receipt.hash, blockNumber: receipt.blockNumber });
    } catch (err) {
        console.error('execute-action error:', err.message);
        res.status(500).json({ error: 'Failed to execute inspector action', details: err.message });
    }
});

// ══════════════════════════════════════════════
// PUBLIC ROUTES (no auth)
// ══════════════════════════════════════════════

/**
 * GET /api/blockchain/verify/:identifier
 * Verify a medicine — by QR hash, batch number, or scratch code
 */
router.get('/verify/:identifier', async (req, res) => {
    try {
        const { identifier } = req.params;

        // Try to find batch by QR hash
        let batch = db.findOne('batch_metadata', b => b.qrHash === identifier);

        // Try by batch number
        if (!batch) {
            batch = db.findOne('batch_metadata', b => b.batchNumber === identifier);
        }

        // Try by scratch code
        if (!batch) {
            batch = db.findOne('batch_metadata', b => b.scratchCode === identifier);
        }

        // Try by batchId hash
        if (!batch) {
            batch = db.findOne('batch_metadata', b => b.id === identifier);
        }

        if (!batch) {
            return res.json({
                verified: false,
                status: 'COUNTERFEIT',
                message: 'This medicine could not be verified. It may be counterfeit.',
            });
        }

        // Get blockchain data
        const contract = blockchain.getContract();
        let blockchainData = null;
        let supplyChain = [];

        try {
            const details = await contract.getBatchDetails(batch.id);
            blockchainData = blockchain.formatBatch(details);

            const history = await contract.getBatchHistory(batch.id);
            supplyChain = history.map(blockchain.formatTransferRecord);
        } catch (e) {
            console.error('Blockchain read error:', e.message);
        }

        res.json({
            verified: true,
            status: blockchainData?.recalled ? 'RECALLED' : 'GENUINE',
            medicine: {
                name: batch.medicineName,
                drugName: batch.medicineName,
                medicineName: batch.medicineName,
                composition: batch.composition,
                dosageForm: batch.dosageForm,
                batchNumber: batch.batchNumber,
                manufacturer: batch.manufacturerName,
                mfgDate: batch.mfgDate,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity,
                mrp: batch.mrp,
            },
            blockchain: blockchainData,
            supplyChain,
            scratchCodeUsed: blockchainData?.activated || false,
            activatedBy: blockchainData?.activatedBy || null,
        });
    } catch (err) {
        res.status(500).json({ error: 'Verification failed', details: err.message });
    }
});

/**
 * POST /api/blockchain/verify-scratch
 * Verify using scratch code (activates on blockchain)
 */
router.post('/verify-scratch', async (req, res) => {
    try {
        const { batchNumber, scratchCode } = req.body;
        if (!batchNumber || !scratchCode) {
            return res.status(400).json({ error: 'batchNumber and scratchCode required' });
        }

        const batch = db.findOne('batch_metadata', b => b.batchNumber === batchNumber);
        if (!batch) {
            return res.json({ verified: false, status: 'COUNTERFEIT', message: 'Batch not found' });
        }

        // Activate on blockchain using a consumer account (index 5+)
        const provider = blockchain.getProvider();
        const config = blockchain.loadConfig();
        const consumerSigner = await provider.getSigner(5);
        const contract = new ethers.Contract(config.address, config.abi, consumerSigner);

        const batchIdHash = blockchain.hashBatchId(batchNumber);
        const tx = await contract.activateProduct(batchIdHash, scratchCode);
        const receipt = await tx.wait();

        // Check events to determine if first activation
        const firstActivation = receipt.logs.some(log => {
            try {
                const parsed = contract.interface.parseLog(log);
                return parsed?.name === 'ScratchCodeUsed';
            } catch { return false; }
        });

        // Persist scratch activation to Supabase (non-blocking)
        saveScratchActivation({
            batchNumber,
            batchIdHash:     blockchain.hashBatchId(batchNumber),
            txHash:          receipt.hash,
            consumerAddress: consumerSigner.address,
        }).catch(e => console.error('Supabase scratch save failed:', e.message));

        res.json({
            verified: true,
            firstActivation,
            status: firstActivation ? 'GENUINE' : 'SUSPICIOUS',
            message: firstActivation
                ? '✅ First activation — product is genuine!'
                : '⚠️ Product was already activated. May be counterfeit.',
            txHash: receipt.hash,
        });
    } catch (err) {
        console.error('Scratch verification error:', err.message);
        if (err.message.includes('Invalid scratch code')) {
            return res.json({ verified: false, status: 'COUNTERFEIT', message: 'Invalid scratch code' });
        }
        res.status(500).json({ error: 'Verification failed', details: err.message });
    }
});

/**
 * GET /api/blockchain/medicine/:name/batches
 * Get ALL batches of a medicine from ALL manufacturers
 */
router.get('/medicine/:name/batches', async (req, res) => {
    try {
        const name = req.params.name.toLowerCase().trim();
        const allBatches = db.findAll('batch_metadata', b =>
            b.medicineName.toLowerCase().includes(name)
        );

        // Enrich with blockchain status
        const contract = blockchain.getContract();
        const results = [];

        for (const batch of allBatches) {
            let blockchainData = null;
            try {
                const details = await contract.getBatchDetails(batch.id);
                blockchainData = blockchain.formatBatch(details);
            } catch { /* batch may not exist on chain yet */ }

            results.push({
                batchNumber: batch.batchNumber,
                medicineName: batch.medicineName,
                composition: batch.composition,
                dosageForm: batch.dosageForm,
                manufacturer: batch.manufacturerName,
                mfgDate: batch.mfgDate,
                expiryDate: batch.expiryDate,
                quantity: batch.quantity,
                mrp: batch.mrp,
                status: blockchainData?.status || 'Registered',
                recalled: blockchainData?.recalled || false,
                inspectorApproved: blockchainData?.inspectorApproved || false,
                activated: blockchainData?.activated || false,
                registeredAt: batch.createdAt,
            });
        }

        res.json({ medicineName: req.params.name, totalBatches: results.length, batches: results });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch batches', details: err.message });
    }
});

/**
 * GET /api/blockchain/batch/:batchNumber
 * Get full details of a single batch including supply chain
 */
router.get('/batch/:batchNumber', async (req, res) => {
    try {
        const { batchNumber } = req.params;
        const batch = db.findOne('batch_metadata', b => b.batchNumber === batchNumber);

        if (!batch) {
            return res.status(404).json({ error: 'Batch not found' });
        }

        const contract = blockchain.getContract();
        let blockchainData = null;
        let supplyChain = [];

        try {
            const details = await contract.getBatchDetails(batch.id);
            blockchainData = blockchain.formatBatch(details);
            const history = await contract.getBatchHistory(batch.id);
            supplyChain = history.map(blockchain.formatTransferRecord);
        } catch (e) { /* blockchain may be unavailable */ }

        res.json({
            ...batch,
            blockchain: blockchainData,
            supplyChain,
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch batch', details: err.message });
    }
});

/**
 * GET /api/blockchain/stats
 * Overall platform statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const allBatches = db.findAll('batch_metadata');
        const manufacturers = new Set(allBatches.map(b => b.manufacturerName));

        let blockchainCount = 0;
        try {
            const contract = blockchain.getContract();
            blockchainCount = Number(await contract.getBatchCount());
        } catch { /* blockchain may be unavailable */ }

        res.json({
            totalBatches: allBatches.length,
            blockchainBatches: blockchainCount,
            manufacturers: manufacturers.size,
            manufacturerNames: [...manufacturers],
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch stats', details: err.message });
    }
});

/**
 * GET /api/blockchain/all-batches
 * List all batches (for customers to browse)
 */
/**
 * GET /api/blockchain/batch/:batchNumber/history-pg
 * Full transfer history for a batch from Supabase (PostgreSQL)
 */
router.get('/batch/:batchNumber/history-pg', async (req, res) => {
    try {
        const history = await getBatchHistory(req.params.batchNumber);
        res.json({ batchNumber: req.params.batchNumber, history });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch history', details: err.message });
    }
});

/**
 * GET /api/blockchain/recent-transfers
 * Latest transfer events across all batches from Supabase
 */
router.get('/recent-transfers', async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 200);
        const transfers = await getRecentTransfers(limit);
        res.json({ transfers });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch transfers', details: err.message });
    }
});

/**
 * GET /api/blockchain/transaction-history
 * Combined transaction history — Supabase first, local JSON fallback
 * Query params: ?limit=100&batch=PCM-2026-001&action=transferToDistributor
 */
router.get('/transaction-history', async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 100, 500);
        const batchFilter = req.query.batch || null;
        const actionFilter = req.query.action || null;

        // 1) Try Supabase
        let transactions = [];
        try {
            if (batchFilter) {
                transactions = await getBatchHistory(batchFilter);
            } else {
                transactions = await getRecentTransfers(limit);
            }
        } catch (e) {
            console.warn('Supabase unavailable, falling back to local JSON:', e.message);
        }

        // 2) Merge local supply_chain_steps.json as fallback / enrichment
        const localSteps = db.findAll('supply_chain_steps') || [];
        const supabaseTxHashes = new Set(transactions.map(t => t.tx_hash));
        const localOnly = localSteps
            .filter(s => !supabaseTxHashes.has(s.txHash))
            .map(s => ({
                id: s.txHash,
                batch_number: s.batchNumber,
                batch_id_hash: null,
                medicine_name: null,
                action: s.action,
                location: s.location || null,
                tx_hash: s.txHash,
                block_number: null,
                from_address: null,
                to_address: null,
                signer_index: null,
                user_id: null,
                timestamp: s.timestamp,
            }));

        // Enrich local entries with medicine name from batch_metadata
        localOnly.forEach(entry => {
            const batch = db.findOne('batch_metadata', b => b.batchNumber === entry.batch_number);
            if (batch) entry.medicine_name = batch.medicineName;
        });

        let combined = [...transactions, ...localOnly];

        // Apply filters
        if (batchFilter) {
            combined = combined.filter(t => t.batch_number === batchFilter);
        }
        if (actionFilter) {
            combined = combined.filter(t => t.action === actionFilter);
        }

        // Sort by timestamp descending & limit
        combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        combined = combined.slice(0, limit);

        // Also fetch batch_registrations for context (batch name lookup)
        const batchLookup = {};
        db.findAll('batch_metadata').forEach(b => {
            batchLookup[b.batchNumber] = b.medicineName;
        });

        // Enrich medicine_name if missing
        combined.forEach(t => {
            if (!t.medicine_name && t.batch_number && batchLookup[t.batch_number]) {
                t.medicine_name = batchLookup[t.batch_number];
            }
        });

        res.json({
            total: combined.length,
            transactions: combined,
            source: transactions.length > 0 ? 'supabase+local' : 'local',
        });
    } catch (err) {
        console.error('Transaction history error:', err.message);
        res.status(500).json({ error: 'Failed to fetch transaction history', details: err.message });
    }
});

router.get('/all-batches', async (req, res) => {
    try {
        const allBatches = db.findAll('batch_metadata');
        const simplified = allBatches.map(b => ({
            batchNumber: b.batchNumber,
            medicineName: b.medicineName,
            composition: b.composition,
            manufacturer: b.manufacturerName,
            mfgDate: b.mfgDate,
            expiryDate: b.expiryDate,
            quantity: b.quantity,
            mrp: b.mrp,
            qrHash: b.qrHash,
            registeredAt: b.createdAt,
        }));
        res.json({ batches: simplified });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch batches', details: err.message });
    }
});

module.exports = router;
