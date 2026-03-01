/**
 * Blockchain Service — ethers.js v6 helper for PharmaChain smart contract
 */
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Load contract config (ABI + address) from deploy output
let contractConfig = null;
function loadConfig() {
    if (contractConfig) return contractConfig;
    const configPath = path.join(__dirname, '..', '..', 'src', 'utils', 'contractConfig.json');
    if (!fs.existsSync(configPath)) {
        throw new Error('Contract not deployed. Run: npx hardhat node, then npm run deploy');
    }
    contractConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return contractConfig;
}

// Provider — connects to local Hardhat node (or configured RPC)
// Override fee data to keep gas costs near-zero on local network
let _providerInstance = null;
function getProvider() {
    if (_providerInstance) return _providerInstance;
    const rpcUrl = process.env.RPC_URL || 'http://127.0.0.1:8545';
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Set Hardhat base fee to 0 on startup (fire-and-forget)
    fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', method: 'hardhat_setNextBlockBaseFeePerGas', params: ['0x0'], id: 99 })
    }).catch(() => {});

    // Wrap getFeeData to return near-zero gas prices
    const origGetFeeData = provider.getFeeData.bind(provider);
    provider.getFeeData = async function () {
        // Reset base fee before every tx
        try {
            await fetch(rpcUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'hardhat_setNextBlockBaseFeePerGas', params: ['0x0'], id: 98 })
            });
        } catch {}
        return new ethers.FeeData(
            1n,   // gasPrice: 1 wei
            1n,   // maxFeePerGas: 1 wei
            1n    // maxPriorityFeePerGas: 1 wei
        );
    };
    _providerInstance = provider;
    return provider;
}

// Get contract instance (read-only)
function getContract() {
    const config = loadConfig();
    const provider = getProvider();
    return new ethers.Contract(config.address, config.abi, provider);
}

// Get contract with signer (for write operations)
function getSignedContract(privateKey) {
    const config = loadConfig();
    const provider = getProvider();
    const signer = new ethers.Wallet(privateKey, provider);
    return new ethers.Contract(config.address, config.abi, signer);
}

// Get signer from Hardhat's default accounts (index 0 = owner)
async function getDefaultSigner(accountIndex = 0) {
    const provider = getProvider();
    const accounts = await provider.listAccounts();
    if (accountIndex >= accounts.length) throw new Error('Account index out of range');
    return accounts[accountIndex];
}

// Status enum mapping
const STATUS_MAP = {
    0: 'Manufactured',
    1: 'In Transit (to Distributor)',
    2: 'At Distributor',
    3: 'In Transit (to Retailer)',
    4: 'At Retailer',
    5: 'Inspector Approved',
    6: 'Sold',
    7: 'Recalled',
    8: 'Flagged'
};

const ROLE_MAP = {
    0: 'None',
    1: 'Manufacturer',
    2: 'Distributor',
    3: 'Retailer',
    4: 'Inspector',
    5: 'Auditor'
};

// Format batch details from contract response
function formatBatch(details) {
    return {
        batchId: details[0],        // bytes32
        metadataHash: details[1],   // bytes32
        manufacturer: details[2],    // address
        currentHolder: details[3],   // address
        status: STATUS_MAP[Number(details[4])] || 'Unknown',
        statusCode: Number(details[4]),
        activated: details[5],
        activatedBy: details[6],
        firstScanBlock: Number(details[7]),
        inspectorApproved: details[8],
        inspectorAddress: details[9],
        parentBatchId: details[10],
        recalled: details[11],
        recallReason: details[12],
        createdAt: Number(details[13]),
        updatedAt: Number(details[14]),
    };
}

// Format transfer record
function formatTransferRecord(record) {
    return {
        from: record.from,
        to: record.to,
        timestamp: Number(record.timestamp),
        date: new Date(Number(record.timestamp) * 1000).toISOString(),
        status: Number(record.status),
        statusName: STATUS_MAP[Number(record.status)] || 'Unknown',
        location: record.location,
    };
}

// Create batch ID hash from string
function hashBatchId(batchIdString) {
    return ethers.keccak256(ethers.toUtf8Bytes(batchIdString));
}

// Create metadata hash from object
function hashMetadata(metadataObj) {
    return ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadataObj)));
}

// Create scratch code hash
function hashScratchCode(scratchCode) {
    return ethers.keccak256(ethers.toUtf8Bytes(scratchCode));
}

module.exports = {
    loadConfig,
    getProvider,
    getContract,
    getSignedContract,
    getDefaultSigner,
    formatBatch,
    formatTransferRecord,
    hashBatchId,
    hashMetadata,
    hashScratchCode,
    STATUS_MAP,
    ROLE_MAP,
};
