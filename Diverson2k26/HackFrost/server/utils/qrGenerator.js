/**
 * QR Code Generator for PharmaChain batches
 */
const crypto = require('crypto');

// Generate a unique scratch code for a batch
function generateScratchCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

// Generate QR data payload for a batch (encodes batchNumber + scratchCode)
function generateQRPayload(batchId, batchNumber, manufacturerAddress, scratchCode) {
    const salt = crypto.randomBytes(8).toString('hex');
    const qrHash = crypto.createHash('sha256')
        .update(`${batchId}:${batchNumber}:${manufacturerAddress}:${salt}`)
        .digest('hex');

    return {
        qrHash,
        payload: JSON.stringify({
            batchNumber,
            scratchCode: scratchCode || '',
        }),
        salt,
    };
}

// Verify a QR hash against stored data
function verifyQRHash(batchId, batchNumber, manufacturerAddress, salt) {
    return crypto.createHash('sha256')
        .update(`${batchId}:${batchNumber}:${manufacturerAddress}:${salt}`)
        .digest('hex');
}

module.exports = { generateScratchCode, generateQRPayload, verifyQRHash };
