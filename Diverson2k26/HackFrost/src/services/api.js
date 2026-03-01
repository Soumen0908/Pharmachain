/**
 * PharmaChain API Client
 * All backend communication goes through here
 */

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

function getToken() {
    return sessionStorage.getItem('pharma_token') || '';
}

function setToken(token) {
    sessionStorage.setItem('pharma_token', token);
}

function clearToken() {
    sessionStorage.removeItem('pharma_token');
}

async function request(endpoint, options = {}) {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        ...options,
    };

    try {
        const res = await fetch(`${API_BASE}${endpoint}`, config);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    } catch (err) {
        throw err;
    }
}

// ── Auth ──
export async function signup(userData) {
    const data = await request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
    setToken(data.token);
    return data;
}

export async function login(email, password, role) {
    const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
    });
    // Two-step login: if server says requireOTP, don't set token yet
    if (data.requireOTP) return data;
    setToken(data.token);
    return data;
}

export async function loginVerify(email, otp, role) {
    const data = await request('/auth/login-verify', {
        method: 'POST',
        body: JSON.stringify({ email, otp, role }),
    });
    setToken(data.token);
    return data;
}

export async function logout() {
    try {
        await request('/auth/logout', { method: 'POST' });
    } catch { }
    clearToken();
}

export async function getMe() {
    return request('/auth/me');
}

// ── Profile ──
export async function getProfile() {
    return request('/profile');
}

export async function updateProfile(updates) {
    return request('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
    });
}

export async function verifyGovtId() {
    return request('/profile/verify-id', { method: 'POST' });
}

// ── Saved Medicines ──
export async function saveMedicine(medicine) {
    return request('/profile/saved-medicines', {
        method: 'POST',
        body: JSON.stringify({ medicine }),
    });
}

export async function removeSavedMedicine(name) {
    return request(`/profile/saved-medicines/${encodeURIComponent(name)}`, {
        method: 'DELETE',
    });
}

// ── Search History ──
export async function saveSearchHistory(query) {
    return request('/profile/search-history', {
        method: 'POST',
        body: JSON.stringify({ query }),
    });
}

export async function getSearchHistory() {
    return request('/profile/search-history');
}

// ── Expiry Alerts ──
export async function setExpiryAlert(batchId, medicineName, expiryDate) {
    return request('/profile/expiry-alerts', {
        method: 'POST',
        body: JSON.stringify({ batchId, medicineName, expiryDate }),
    });
}

// ── Reports ──
export async function reportFake(reportData) {
    return request('/reports', {
        method: 'POST',
        body: JSON.stringify(reportData),
    });
}

export async function getReports() {
    return request('/reports');
}

export async function getBatchReports(batchId) {
    return request(`/reports/batch/${encodeURIComponent(batchId)}`);
}

// ── Email OTP ──
export async function sendOTP(email) {
    return request('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

export async function verifyOTP(email, otp) {
    return request('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
    });
}

// ── Blockchain Batches ──
export async function registerBatch(batchData) {
    return request('/blockchain/batch/register', {
        method: 'POST',
        body: JSON.stringify(batchData),
    });
}

export async function getMyBatches() {
    return request('/blockchain/batch/my-batches');
}

export async function getMedicineBatches(medicineName) {
    return request(`/blockchain/medicine/${encodeURIComponent(medicineName)}/batches`);
}

export async function verifyBatch(identifier) {
    return request(`/blockchain/verify/${encodeURIComponent(identifier)}`);
}

export async function getBlockchainStats() {
    return request('/blockchain/stats');
}

export async function getAllBatches() {
    return request('/blockchain/all-batches');
}

// ── Blockchain — transfer page batches (enriched with on-chain status) ──
export async function getTransferBatches() {
    return request('/blockchain/transfer-batches');
}

// ── Blockchain — single batch details ──
export async function getBatchDetails(batchNumber) {
    return request(`/blockchain/batch/${encodeURIComponent(batchNumber)}`);
}

// ── Blockchain — update supply chain (transfer / acknowledge / inspect) ──
export async function updateSupplyChain(batchNumber, action, location, recipientAddress) {
    return request(`/blockchain/batch/${encodeURIComponent(batchNumber)}/update-supply-chain`, {
        method: 'POST',
        body: JSON.stringify({ action, location, recipientAddress }),
    });
}

// ── QR-based Transfer ──
export async function generateTransferQR(batchNumber, location) {
    return request('/blockchain/transfer-qr/generate', {
        method: 'POST',
        body: JSON.stringify({ batchNumber, location }),
    });
}

export async function scanTransferQR(qrPayload) {
    return request('/blockchain/transfer-qr/scan', {
        method: 'POST',
        body: JSON.stringify({ qrPayload }),
    });
}

export async function getPendingTransferQRs() {
    return request('/blockchain/transfer-qr/pending');
}

export async function autoTransferFromQR(batchNumber, location) {
    return request('/blockchain/transfer-qr/auto-transfer', {
        method: 'POST',
        body: JSON.stringify({ batchNumber, location }),
    });
}

export async function executeActionQR(qrPayload) {
    return request('/blockchain/transfer-qr/execute-action', {
        method: 'POST',
        body: JSON.stringify({ qrPayload }),
    });
}

// ── Blockchain — verify scratch code (activate product on chain) ──
export async function verifyScratchCode(batchNumber, scratchCode) {
    return request('/blockchain/verify-scratch', {
        method: 'POST',
        body: JSON.stringify({ batchNumber, scratchCode }),
    });
}

// ── Transaction History ──
export async function getTransactionHistory({ limit = 100, batch = null, action = null } = {}) {
    const params = new URLSearchParams();
    if (limit) params.set('limit', limit);
    if (batch) params.set('batch', batch);
    if (action) params.set('action', action);
    return request(`/blockchain/transaction-history?${params.toString()}`);
}

export async function getBatchHistoryPg(batchNumber) {
    return request(`/blockchain/batch/${encodeURIComponent(batchNumber)}/history-pg`);
}

// ── Medicine Lookup ──
export async function searchMedicines(query) {
    return request(`/medicines/search?q=${encodeURIComponent(query)}`);
}

export async function lookupMedicine(query) {
    return request(`/medicines/lookup?q=${encodeURIComponent(query)}`);
}

// ── Gemini AI Medicine Details ──
export async function getGeminiMedicineDetails(medicineName) {
    return request('/gemini/medicine-details', {
        method: 'POST',
        body: JSON.stringify({ medicineName }),
    });
}

export async function compareMedicines(medicines) {
    return request('/gemini/medicine-compare', {
        method: 'POST',
        body: JSON.stringify({ medicines }),
    });
}

// ── Real-time SSE ──
export function subscribeToBatchUpdates(onEvent) {
    const baseUrl = API_BASE.replace('/api', '');
    const eventSource = new EventSource(`${baseUrl}/api/live/batch-stream`);

    eventSource.onmessage = (e) => {
        try { onEvent(JSON.parse(e.data)); } catch { }
    };

    eventSource.addEventListener('batch-registered', (e) => {
        try { onEvent(JSON.parse(e.data)); } catch { }
    });

    eventSource.addEventListener('batch-transferred', (e) => {
        try { onEvent(JSON.parse(e.data)); } catch { }
    });

    eventSource.addEventListener('batch-activated', (e) => {
        try { onEvent(JSON.parse(e.data)); } catch { }
    });

    eventSource.onerror = () => {
        console.warn('SSE connection lost, will auto-reconnect...');
    };

    return eventSource; // caller should call .close() on cleanup
}

export async function getRecentEvents() {
    return request('/live/recent-events');
}

export { getToken, clearToken };
