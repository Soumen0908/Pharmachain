/**
 * Seed script — uses the RUNNING Hardhat node via JSON-RPC (not in-process VM)
 * Usage: node scripts/seed.cjs
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const accounts = await provider.listAccounts();
    const [owner, manufacturer, distributor, retailer, inspector] = accounts;

    // Get deployed contract
    const contractConfig = JSON.parse(
        fs.readFileSync(path.join(__dirname, "..", "src", "utils", "contractConfig.json"), "utf8")
    );
    const contract = new ethers.Contract(contractConfig.address, contractConfig.abi, owner);

    // Helper: load & save batch_metadata.json so the server API can find seed data
    const batchMetaPath = path.join(__dirname, '..', 'server', 'data', 'batch_metadata.json');
    function loadBatchMeta() {
        try { return JSON.parse(fs.readFileSync(batchMetaPath, 'utf8')); } catch { return []; }
    }
    function saveBatchMeta(arr) {
        fs.writeFileSync(batchMetaPath, JSON.stringify(arr, null, 2), 'utf8');
    }

    console.log("\n🔐 Granting roles...");
    await (await contract.grantRole(manufacturer.address, 1)).wait();
    console.log(`  ✅ Manufacturer: ${manufacturer.address}`);
    await (await contract.grantRole(distributor.address, 2)).wait();
    console.log(`  ✅ Distributor: ${distributor.address}`);
    await (await contract.grantRole(retailer.address, 3)).wait();
    console.log(`  ✅ Retailer: ${retailer.address}`);
    await (await contract.grantRole(inspector.address, 4)).wait();
    console.log(`  ✅ Inspector: ${inspector.address}`);

    // Create sample batches
    console.log("\n💊 Creating sample batches...");

    const batches = [
        { name: "Paracetamol 500mg", id: "PCM-2026-001", expiry: "2027-06-15", location: "Mumbai, India", scratch: "XKRF82NP" },
        { name: "Amoxicillin 250mg", id: "AMX-2026-002", expiry: "2027-03-20", location: "Hyderabad, India", scratch: "M3QW9TYA" },
        { name: "Metformin 500mg", id: "MET-2026-003", expiry: "2027-09-01", location: "Pune, India", scratch: "J7LP4XCR" },
        { name: "COVID Vaccine Dose", id: "COV-2026-004", expiry: "2026-08-30", location: "Ahmedabad, India", scratch: "VX92KFBN" },
        { name: "Ibuprofen 400mg", id: "IBU-2026-005", expiry: "2027-12-31", location: "Chennai, India", scratch: "QZ5D8MVH" },
    ];

    const metadata = {};
    // Reset batch_metadata.json so we start clean (no stale entries)
    const batchMetaRecords = [];

    for (const b of batches) {
        const batchIdHash = ethers.keccak256(ethers.toUtf8Bytes(b.id));
        const metadataObj = { drugName: b.name, batchId: b.id, expiryDate: b.expiry, manufacturingLocation: b.location };
        const metadataHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadataObj)));
        const scratchHash = ethers.keccak256(ethers.toUtf8Bytes(b.scratch));

        const mfgContract = new ethers.Contract(contractConfig.address, contractConfig.abi, manufacturer);
        const tx = await mfgContract.createBatch(batchIdHash, metadataHash, scratchHash);
        const receipt = await tx.wait();
        console.log(`  ✅ Created: ${b.name} (${b.id}) | Scratch: ${b.scratch}`);

        metadata[b.id] = { ...metadataObj, scratchCode: b.scratch, batchIdHash };

        // Generate a QR hash to be consistent with the server's batch registration flow
        const salt = crypto.randomBytes(8).toString('hex');
        const qrHash = crypto.createHash('sha256')
            .update(`${batchIdHash}:${b.id}:${manufacturer.address}:${salt}`)
            .digest('hex');

        // Store in batch_metadata.json so the server API can verify these batches
        const alreadyExists = batchMetaRecords.some(r => r.batchNumber === b.id);
        if (!alreadyExists) {
            batchMetaRecords.push({
                id: batchIdHash,
                medicineName: b.name,
                batchNumber: b.id,
                composition: b.name, // seed data uses name as composition
                dosageForm: 'Tablet',
                mfgDate: new Date().toISOString().split('T')[0],
                expiryDate: b.expiry,
                quantity: 1000,
                mrp: 0,
                manufacturerName: 'Seed Manufacturer',
                scratchCode: b.scratch,
                qrHash,
                qrPayload: JSON.stringify({ batchId: batchIdHash, batchNumber: b.id, qrHash, t: Date.now() }),
                qrSalt: salt,
                userId: 'seed',
                manufacturerAddress: manufacturer.address,
                txHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                createdAt: new Date().toISOString(),
            });
        }
    }

    // Persist batch metadata
    saveBatchMeta(batchMetaRecords);

    // Helper: get contract connected to a specific signer
    function asContract(signer) {
        return new ethers.Contract(contractConfig.address, contractConfig.abi, signer);
    }
    const mfr = asContract(manufacturer);
    const dist = asContract(distributor);
    const ret = asContract(retailer);
    const insp = asContract(inspector);

    // Transfer first batch through full chain
    console.log("\n📦 Simulating supply chain for Paracetamol 500mg...");
    const batch1Hash = ethers.keccak256(ethers.toUtf8Bytes("PCM-2026-001"));

    await (await mfr.transferToDistributor(batch1Hash, distributor.address, "Mumbai Warehouse")).wait();
    console.log("  ✅ Transferred to Distributor");

    await (await dist.acknowledgeByDistributor(batch1Hash, "Delhi Distribution Center")).wait();
    console.log("  ✅ Distributor acknowledged receipt");

    await (await dist.transferToRetailer(batch1Hash, retailer.address, "Delhi Distribution Center")).wait();
    console.log("  ✅ Transferred to Retailer");

    await (await ret.acknowledgeByRetailer(batch1Hash, "Apollo Pharmacy, Kolkata")).wait();
    console.log("  ✅ Retailer acknowledged receipt");

    await (await insp.inspectAndApprove(batch1Hash)).wait();
    console.log("  ✅ Inspector approved for sale");

    // Transfer second batch partially
    console.log("\n📦 Partial transfer for Amoxicillin 250mg...");
    const batch2Hash = ethers.keccak256(ethers.toUtf8Bytes("AMX-2026-002"));

    await (await mfr.transferToDistributor(batch2Hash, distributor.address, "Hyderabad Warehouse")).wait();
    console.log("  ✅ Transferred to Distributor");

    await (await dist.acknowledgeByDistributor(batch2Hash, "Bangalore Distribution Hub")).wait();
    console.log("  ✅ Distributor acknowledged receipt");

    // Flag third batch
    console.log("\n🚩 Flagging Metformin batch (for demo)...");
    const batch3Hash = ethers.keccak256(ethers.toUtf8Bytes("MET-2026-003"));
    await (await mfr.transferToDistributor(batch3Hash, distributor.address, "Pune Warehouse")).wait();
    await (await dist.acknowledgeByDistributor(batch3Hash, "Nagpur Center")).wait();
    await (await insp.flagBatch(batch3Hash)).wait();
    console.log("  ✅ Batch flagged by Inspector");

    console.log("\n🎉 Seed complete! Metadata for QR codes:");
    console.log(JSON.stringify(metadata, null, 2));
    console.log("\n📋 Accounts:");
    console.log(`  Owner:        ${owner.address}`);
    console.log(`  Manufacturer: ${manufacturer.address}`);
    console.log(`  Distributor:  ${distributor.address}`);
    console.log(`  Retailer:     ${retailer.address}`);
    console.log(`  Inspector:    ${inspector.address}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
