/**
 * Supabase client & helper functions for persisting transaction history
 * Tables:
 *   - transaction_history  : every supply-chain transfer / action
 *   - batch_registrations  : every new batch registered on-chain
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://smxrekixzgnezgzptxji.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'sb_publishable_ODRV6p644P0zzP6WThdXIw_VebRph8n';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Batch Registrations ─────────────────────────────────────────────────────

/**
 * Save a new batch registration to Supabase.
 * @param {object} batch  - fields from blockchain.js batch/register route
 */
async function saveBatchRegistration(batch) {
    const { error } = await supabase.from('batch_registrations').insert({
        batch_id_hash:        batch.id,
        batch_number:         batch.batchNumber,
        medicine_name:        batch.medicineName,
        composition:          batch.composition,
        dosage_form:          batch.dosageForm,
        mfg_date:             batch.mfgDate,
        expiry_date:          batch.expiryDate,
        quantity:             batch.quantity,
        mrp:                  batch.mrp,
        manufacturer_name:    batch.manufacturerName,
        manufacturer_address: batch.manufacturerAddress,
        tx_hash:              batch.txHash,
        block_number:         batch.blockNumber,
        qr_hash:              batch.qrHash,
        scratch_code:         batch.scratchCode,
        user_id:              batch.userId,
        created_at:           batch.createdAt,
    });

    if (error) {
        console.error('⚠️  Supabase saveBatchRegistration error:', error.message);
    } else {
        console.log(`✅  Supabase: batch_registrations ← ${batch.batchNumber}`);
    }
}

// ── Transaction History ─────────────────────────────────────────────────────

/**
 * Save a supply-chain transfer event to Supabase.
 * @param {object} step
 */
async function saveTransactionHistory(step) {
    const { error } = await supabase.from('transaction_history').insert({
        batch_number:   step.batchNumber,
        batch_id_hash:  step.batchIdHash  || null,
        medicine_name:  step.medicineName || null,
        action:         step.action,
        location:       step.location     || null,
        tx_hash:        step.txHash,
        block_number:   step.blockNumber  || null,
        from_address:   step.fromAddress  || null,
        to_address:     step.toAddress    || null,
        signer_index:   step.signerIndex  || null,
        user_id:        step.userId       || null,
        timestamp:      step.timestamp,
    });

    if (error) {
        console.error('⚠️  Supabase saveTransactionHistory error:', error.message);
    } else {
        console.log(`✅  Supabase: transaction_history ← ${step.batchNumber} / ${step.action}`);
    }
}

// ── Scratch Activation ──────────────────────────────────────────────────────

/**
 * Save a scratch-code activation event.
 * @param {object} activation
 */
async function saveScratchActivation(activation) {
    const { error } = await supabase.from('transaction_history').insert({
        batch_number:  activation.batchNumber,
        batch_id_hash: activation.batchIdHash || null,
        medicine_name: null,
        action:        'scratchActivation',
        location:      null,
        tx_hash:       activation.txHash,
        block_number:  null,
        from_address:  null,
        to_address:    activation.consumerAddress || null,
        signer_index:  null,
        user_id:       null,
        timestamp:     new Date().toISOString(),
    });

    if (error) {
        console.error('⚠️  Supabase saveScratchActivation error:', error.message);
    } else {
        console.log(`✅  Supabase: transaction_history ← ${activation.batchNumber} / scratchActivation`);
    }
}

// ── Queries ─────────────────────────────────────────────────────────────────

/** Fetch full history of a batch by batch_number */
async function getBatchHistory(batchNumber) {
    const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .eq('batch_number', batchNumber)
        .order('timestamp', { ascending: true });

    if (error) {
        console.error('⚠️  Supabase getBatchHistory error:', error.message);
        return [];
    }
    return data;
}

/** Fetch all registered batches */
async function getAllRegistrations() {
    const { data, error } = await supabase
        .from('batch_registrations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('⚠️  Supabase getAllRegistrations error:', error.message);
        return [];
    }
    return data;
}

/** Fetch recent transfer events (for analytics / admin) */
async function getRecentTransfers(limit = 50) {
    const { data, error } = await supabase
        .from('transaction_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('⚠️  Supabase getRecentTransfers error:', error.message);
        return [];
    }
    return data;
}

module.exports = {
    supabase,
    saveBatchRegistration,
    saveTransactionHistory,
    saveScratchActivation,
    getBatchHistory,
    getAllRegistrations,
    getRecentTransfers,
};
