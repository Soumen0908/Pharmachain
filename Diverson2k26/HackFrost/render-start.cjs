/**
 * Render.com startup script for PharmaChain
 * 
 * On every cold start:
 * 1. Starts an embedded Hardhat blockchain node
 * 2. Deploys the PharmaChain smart contract
 * 3. Seeds sample batch data + simulates supply chain
 * 4. Starts the Express API server
 */
const { spawn } = require('child_process');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const RPC_URL = 'http://127.0.0.1:8545';

// ── Wait for Hardhat node to accept JSON-RPC ──
async function waitForNode(maxAttempts = 60) {
    console.log('⏳ Waiting for Hardhat node to be ready...');
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const res = await fetch(RPC_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 })
            });
            if (res.ok) {
                console.log('✅ Hardhat node is ready');
                return;
            }
        } catch {}
        await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error('Hardhat node failed to start after 60 seconds');
}

// ── Deploy contract + seed data ──
async function deployAndSeed() {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const signer = await provider.getSigner(0);

    // Load compiled artifact
    const artifactPath = path.join(__dirname, 'artifacts', 'contracts', 'PharmaChain.sol', 'PharmaChain.json');
    if (!fs.existsSync(artifactPath)) {
        throw new Error('Compiled artifact not found — build step may have failed');
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // Deploy contract
    console.log('🚀 Deploying PharmaChain contract...');
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`✅ Contract deployed to: ${address}`);

    // Save config so server/services/blockchain.js can find it
    const configDir = path.join(__dirname, 'src', 'utils');
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(
        path.join(configDir, 'contractConfig.json'),
        JSON.stringify({ address, abi: artifact.abi }, null, 2)
    );

    // Grant roles
    console.log('🔐 Granting roles...');
    const accounts = await provider.listAccounts();
    const pharma = new ethers.Contract(address, artifact.abi, signer);
    await (await pharma.grantRole(accounts[1].address, 1)).wait(); // Manufacturer
    await (await pharma.grantRole(accounts[2].address, 2)).wait(); // Distributor
    await (await pharma.grantRole(accounts[3].address, 3)).wait(); // Retailer
    await (await pharma.grantRole(accounts[4].address, 4)).wait(); // Inspector
    console.log('✅ Roles assigned');

    // Create sample batches
    console.log('💊 Creating sample batches...');
    const mfr = new ethers.Contract(address, artifact.abi, await provider.getSigner(1));

    const batches = [
        { name: 'Paracetamol 500mg',  id: 'PCM-2026-001', scratch: 'XKRF82NP', expiry: '2027-06-15' },
        { name: 'Amoxicillin 250mg',  id: 'AMX-2026-002', scratch: 'M3QW9TYA', expiry: '2027-03-20' },
        { name: 'Metformin 500mg',    id: 'MET-2026-003', scratch: 'J7LP4XCR', expiry: '2027-09-01' },
        { name: 'COVID Vaccine Dose', id: 'COV-2026-004', scratch: 'VX92KFBN', expiry: '2026-08-30' },
        { name: 'Ibuprofen 400mg',    id: 'IBU-2026-005', scratch: 'QZ5D8MVH', expiry: '2027-12-31' },
        { name: 'Azithromycin 500mg', id: 'AZI-2026-006', scratch: 'PL8N2RAT', expiry: '2028-01-15' },
    ];

    const batchMetaRecords = [];
    for (const b of batches) {
        const batchIdHash = ethers.keccak256(ethers.toUtf8Bytes(b.id));
        const metaHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ drugName: b.name, batchId: b.id })));
        const scratchHash = ethers.keccak256(ethers.toUtf8Bytes(b.scratch));
        const receipt = await (await mfr.createBatch(batchIdHash, metaHash, scratchHash)).wait();

        const salt = crypto.randomBytes(8).toString('hex');
        const qrHash = crypto.createHash('sha256')
            .update(`${batchIdHash}:${b.id}:${accounts[1].address}:${salt}`)
            .digest('hex');

        batchMetaRecords.push({
            id: batchIdHash,
            medicineName: b.name,
            batchNumber: b.id,
            composition: b.name,
            dosageForm: 'Tablet',
            mfgDate: new Date().toISOString().split('T')[0],
            expiryDate: b.expiry,
            quantity: 1000,
            mrp: 0,
            manufacturerName: 'Seed Manufacturer',
            scratchCode: b.scratch,
            qrHash,
            qrPayload: JSON.stringify({ batchNumber: b.id, scratchCode: b.scratch }),
            qrSalt: salt,
            userId: 'seed',
            manufacturerAddress: accounts[1].address,
            txHash: receipt.hash,
            blockNumber: receipt.blockNumber,
            createdAt: new Date().toISOString(),
        });
        console.log(`  ✅ ${b.name} (${b.id})`);
    }

    // Save batch metadata for the API
    const dataDir = path.join(__dirname, 'server', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(path.join(dataDir, 'batch_metadata.json'), JSON.stringify(batchMetaRecords, null, 2));

    // Simulate full supply chain for every batch
    console.log('📦 Simulating supply chain...');
    const dist = new ethers.Contract(address, artifact.abi, await provider.getSigner(2));
    const ret  = new ethers.Contract(address, artifact.abi, await provider.getSigner(3));
    const insp = new ethers.Contract(address, artifact.abi, await provider.getSigner(4));

    const locations = [
        { mfr: 'Mumbai Warehouse',    dist: 'Delhi Distribution Center',  ret: 'Apollo Pharmacy, Kolkata' },
        { mfr: 'Hyderabad Warehouse', dist: 'Chennai Distribution Hub',   ret: 'MedPlus, Bengaluru' },
        { mfr: 'Pune Warehouse',      dist: 'Nagpur Distribution Center', ret: 'Wellness Forever, Pune' },
        { mfr: 'Ahmedabad Warehouse', dist: 'Surat Distribution Hub',     ret: 'Zydus Hospital Pharmacy' },
        { mfr: 'Chennai Warehouse',   dist: 'Coimbatore Hub',             ret: 'Nilgiris Pharmacy' },
        { mfr: 'Bangalore Warehouse', dist: 'Mysore Distribution Center', ret: 'Manipal Hospital Pharmacy' },
    ];

    for (let i = 0; i < batches.length; i++) {
        const batchHash = ethers.keccak256(ethers.toUtf8Bytes(batches[i].id));
        const loc = locations[i];
        await (await mfr.transferToDistributor(batchHash, accounts[2].address, loc.mfr)).wait();
        await (await dist.acknowledgeByDistributor(batchHash, loc.dist)).wait();
        await (await dist.transferToRetailer(batchHash, accounts[3].address, loc.dist)).wait();
        await (await ret.acknowledgeByRetailer(batchHash, loc.ret)).wait();
        await (await insp.inspectAndApprove(batchHash)).wait();
        console.log(`  ✅ ${batches[i].name} — Inspector Approved`);
    }

    console.log(`🎉 ${batches.length} batches deployed and ready!\n`);
}

// ── Main ──
async function main() {
    const PORT = process.env.PORT || 3001;
    console.log('═══════════════════════════════════════');
    console.log('  PharmaChain — Render Startup');
    console.log(`  PORT=${PORT}  NODE_ENV=${process.env.NODE_ENV || 'development'}`);
    console.log('═══════════════════════════════════════\n');

    // 1. Start Hardhat node in background
    console.log('📡 Starting Hardhat blockchain node...');
    const hardhatNode = spawn('npx', ['hardhat', 'node', '--hostname', '0.0.0.0', '--port', '8545'], {
        cwd: __dirname,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
    });

    hardhatNode.stdout.on('data', d => {
        const line = d.toString().trim();
        if (line && !line.includes('Account #')) console.log(`[blockchain] ${line}`);
    });
    hardhatNode.stderr.on('data', d => {
        const line = d.toString().trim();
        if (line) console.error(`[blockchain-err] ${line}`);
    });
    hardhatNode.on('exit', code => {
        console.error(`❌ Hardhat node exited unexpectedly (code ${code})`);
        process.exit(1);
    });

    // 2. Wait for blockchain node to be ready
    await waitForNode();

    // 3. Deploy contract + seed data
    await deployAndSeed();

    // 4. Set RPC_URL for the server's blockchain service
    process.env.RPC_URL = RPC_URL;

    // 5. Start Express API server
    console.log('🌐 Starting Express API server...');
    require('./server/index.js');
}

main().catch(err => {
    console.error('💥 Fatal startup error:', err);
    process.exit(1);
});
