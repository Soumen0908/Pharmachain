/**
 * Direct deploy script — bypasses Hardhat runner issues on Windows
 * Usage: node scripts/deploy-direct.cjs
 */
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
    console.log('🚀 Deploying PharmaChain (direct)...');

    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    const signer = await provider.getSigner(0); // owner account

    // Load compiled artifact
    const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'PharmaChain.sol', 'PharmaChain.json');
    if (!fs.existsSync(artifactPath)) {
        console.error('❌ Compiled artifact not found. Run: npx hardhat compile');
        process.exit(1);
    }
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

    // Deploy
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    const address = await contract.getAddress();
    console.log(`✅ PharmaChain deployed to: ${address}`);

    // Save config
    const frontendDir = path.join(__dirname, '..', 'src', 'utils');
    if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });

    fs.writeFileSync(
        path.join(frontendDir, 'contractConfig.json'),
        JSON.stringify({ address, abi: artifact.abi }, null, 2)
    );
    console.log('📄 Contract config saved to src/utils/contractConfig.json');

    // ── Grant roles ──
    console.log('\n🔐 Granting roles...');
    const accounts = await provider.listAccounts();
    const pharma = new ethers.Contract(address, artifact.abi, signer);

    await (await pharma.grantRole(accounts[1].address, 1)).wait(); // Manufacturer
    console.log(`  ✅ Manufacturer: ${accounts[1].address}`);
    await (await pharma.grantRole(accounts[2].address, 2)).wait(); // Distributor
    console.log(`  ✅ Distributor:  ${accounts[2].address}`);
    await (await pharma.grantRole(accounts[3].address, 3)).wait(); // Retailer
    console.log(`  ✅ Retailer:     ${accounts[3].address}`);
    await (await pharma.grantRole(accounts[4].address, 4)).wait(); // Inspector
    console.log(`  ✅ Inspector:    ${accounts[4].address}`);

    // ── Create sample batches ──
    console.log('\n💊 Creating sample batches...');
    const mfr = new ethers.Contract(address, artifact.abi, await provider.getSigner(1));

    const batches = [
        { name: 'Paracetamol 500mg', id: 'PCM-2026-001', scratch: 'XKRF82NP', expiry: '2027-06-15', location: 'Mumbai, India' },
        { name: 'Amoxicillin 250mg', id: 'AMX-2026-002', scratch: 'M3QW9TYA', expiry: '2027-03-20', location: 'Hyderabad, India' },
        { name: 'Metformin 500mg', id: 'MET-2026-003', scratch: 'J7LP4XCR', expiry: '2027-09-01', location: 'Pune, India' },
        { name: 'COVID Vaccine Dose', id: 'COV-2026-004', scratch: 'VX92KFBN', expiry: '2026-08-30', location: 'Ahmedabad, India' },
        { name: 'Ibuprofen 400mg', id: 'IBU-2026-005', scratch: 'QZ5D8MVH', expiry: '2027-12-31', location: 'Chennai, India' },
        { name: 'Azithromycin 500mg', id: 'AZI-2026-006', scratch: 'PL8N2RAT', expiry: '2028-01-15', location: 'Bangalore, India' },
    ];

    const batchMetaRecords = [];
    for (const b of batches) {
        const batchIdHash = ethers.keccak256(ethers.toUtf8Bytes(b.id));
        const metaHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ drugName: b.name, batchId: b.id })));
        const scratchHash = ethers.keccak256(ethers.toUtf8Bytes(b.scratch));
        const receipt = await (await mfr.createBatch(batchIdHash, metaHash, scratchHash)).wait();
        console.log(`  ✅ ${b.name} (${b.id}) | Scratch: ${b.scratch}`);

        // Build batch_metadata record
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
    }

    // Save batch_metadata.json for server API
    const batchMetaPath = path.join(__dirname, '..', 'server', 'data', 'batch_metadata.json');
    fs.writeFileSync(batchMetaPath, JSON.stringify(batchMetaRecords, null, 2), 'utf8');
    console.log(`  📋 Saved ${batchMetaRecords.length} batches to batch_metadata.json`);

    // ── Simulate full supply chain for ALL batches ──
    console.log('\n📦 Simulating full supply chain for all batches...');
    const dist = new ethers.Contract(address, artifact.abi, await provider.getSigner(2));
    const ret  = new ethers.Contract(address, artifact.abi, await provider.getSigner(3));
    const insp = new ethers.Contract(address, artifact.abi, await provider.getSigner(4));

    const locations = [
        { mfr: 'Mumbai Warehouse',    dist: 'Delhi Distribution Center', ret: 'Apollo Pharmacy, Kolkata' },
        { mfr: 'Hyderabad Warehouse', dist: 'Chennai Distribution Hub',  ret: 'MedPlus, Bengaluru' },
        { mfr: 'Pune Warehouse',      dist: 'Nagpur Distribution Center',ret: 'Wellness Forever, Pune' },
        { mfr: 'Ahmedabad Warehouse', dist: 'Surat Distribution Hub',    ret: 'Zydus Hospital Pharmacy' },
        { mfr: 'Chennai Warehouse',   dist: 'Coimbatore Hub',            ret: 'Nilgiris Pharmacy' },
        { mfr: 'Bangalore Warehouse', dist: 'Mysore Distribution Center',ret: 'Manipal Hospital Pharmacy' },
    ];

    for (let i = 0; i < batches.length; i++) {
        const batchHash = ethers.keccak256(ethers.toUtf8Bytes(batches[i].id));
        const loc = locations[i];
        console.log(`  🔄 ${batches[i].name} (${batches[i].id})`);
        await (await mfr.transferToDistributor(batchHash, accounts[2].address, loc.mfr)).wait();
        await (await dist.acknowledgeByDistributor(batchHash, loc.dist)).wait();
        await (await dist.transferToRetailer(batchHash, accounts[3].address, loc.dist)).wait();
        await (await ret.acknowledgeByRetailer(batchHash, loc.ret)).wait();
        await (await insp.inspectAndApprove(batchHash)).wait();
        console.log(`  ✅ Inspector Approved — ready for sale`);
    }

    const count = await pharma.getBatchCount();
    console.log(`\n🎉 Done! ${count} batches on blockchain at ${address} — all Inspector Approved`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
