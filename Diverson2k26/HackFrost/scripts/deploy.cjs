const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying PharmaChain...");

    const PharmaChain = await hre.ethers.getContractFactory("PharmaChain");
    const pharmaChain = await PharmaChain.deploy();
    await pharmaChain.waitForDeployment();

    const address = await pharmaChain.getAddress();
    console.log(`✅ PharmaChain deployed to: ${address}`);

    // Save ABI and address for frontend
    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "PharmaChain.sol", "PharmaChain.json");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

    const frontendDir = path.join(__dirname, "..", "src", "utils");
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    fs.writeFileSync(
        path.join(frontendDir, "contractConfig.json"),
        JSON.stringify({ address, abi: artifact.abi }, null, 2)
    );

    console.log("📄 Contract ABI and address saved to src/utils/contractConfig.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
