/**
 * Off-Chain Metadata Store (simulates IPFS / decentralized storage)
 * Uses localStorage for hackathon demo
 */

const STORAGE_KEYS = {
    METADATA: 'pharmachain_metadata',
    SCANS: 'pharmachain_scans',
    REWARDS: 'pharmachain_rewards',
    ALERTS: 'pharmachain_alerts',
};

function getStore(key) {
    try {
        return JSON.parse(localStorage.getItem(key) || '{}');
    } catch { return {}; }
}

function setStore(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

// ── Batch Metadata ──

export function saveBatchMetadata(batchId, metadata) {
    const store = getStore(STORAGE_KEYS.METADATA);
    store[batchId] = {
        ...metadata,
        savedAt: Date.now(),
    };
    setStore(STORAGE_KEYS.METADATA, store);
}

export function getBatchMetadata(batchId) {
    const store = getStore(STORAGE_KEYS.METADATA);
    return store[batchId] || null;
}

export function getAllMetadata() {
    return getStore(STORAGE_KEYS.METADATA);
}

// ── Scan History ──

export function recordScan(batchId, scannerAddress, location = 'Unknown') {
    const store = getStore(STORAGE_KEYS.SCANS);
    if (!store[batchId]) store[batchId] = [];
    store[batchId].push({
        scanner: scannerAddress || 'anonymous',
        location,
        timestamp: Date.now(),
    });
    setStore(STORAGE_KEYS.SCANS, store);
}

export function getScanHistory(batchId) {
    const store = getStore(STORAGE_KEYS.SCANS);
    return store[batchId] || [];
}

export function getAllScans() {
    return getStore(STORAGE_KEYS.SCANS);
}

// ── Rewards ──

export function addRewardPoints(address, points, reason) {
    const store = getStore(STORAGE_KEYS.REWARDS);
    if (!store[address]) store[address] = { total: 0, history: [] };
    store[address].total += points;
    store[address].history.push({ points, reason, timestamp: Date.now() });
    setStore(STORAGE_KEYS.REWARDS, store);
}

export function getRewards(address) {
    const store = getStore(STORAGE_KEYS.REWARDS);
    return store[address] || { total: 0, history: [] };
}

// ── Alerts ──

export function saveAlert(alert) {
    const store = getStore(STORAGE_KEYS.ALERTS);
    const id = Date.now().toString();
    store[id] = { ...alert, id, createdAt: Date.now(), read: false };
    setStore(STORAGE_KEYS.ALERTS, store);
}

export function getAlerts() {
    const store = getStore(STORAGE_KEYS.ALERTS);
    return Object.values(store).sort((a, b) => b.createdAt - a.createdAt);
}

export function clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
}
