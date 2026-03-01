require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.24",
        settings: {
            viaIR: true,
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {
            gasPrice: 1_000_000,        // 0.001 gwei — near-zero gas cost
            initialBaseFeePerGas: 0,     // no EIP-1559 base fee
        },
        localhost: {
            url: "http://127.0.0.1:8545",
            gasPrice: 1_000_000,         // match the node
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    }
};
