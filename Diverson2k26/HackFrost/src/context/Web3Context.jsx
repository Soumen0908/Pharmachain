import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';

const Web3Context = createContext(null);

// Default contract config (will be replaced after deployment)
const DEFAULT_CONFIG = {
    address: '0x0000000000000000000000000000000000000000',
    abi: []
};

const ROLE_NAMES = ['None', 'Manufacturer', 'Distributor', 'Retailer', 'Inspector', 'Auditor'];

// Hardhat localhost network details
const HARDHAT_CHAIN_ID = '0x7A69'; // 31337
const HARDHAT_CHAIN_ID_DEC = 31337;

// RPC URL — in production, points to the backend's /rpc proxy
const RPC_URL = import.meta.env.VITE_RPC_URL || 'http://127.0.0.1:8545';

const HARDHAT_NETWORK = {
    chainId: HARDHAT_CHAIN_ID,
    chainName: 'PharmaChain Network',
    rpcUrls: [RPC_URL],
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
};

/** Ask MetaMask to switch to Hardhat localhost; add the network if it doesn't exist */
async function ensureHardhatNetwork() {
    if (!window.ethereum) return;
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: HARDHAT_CHAIN_ID }],
        });
    } catch (switchErr) {
        // 4902 = chain not added yet
        if (switchErr.code === 4902) {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [HARDHAT_NETWORK],
            });
        } else {
            throw switchErr;
        }
    }
}

export function Web3Provider({ children }) {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);
    const [readOnlyContract, setReadOnlyContract] = useState(null);
    const [account, setAccount] = useState('');
    const [role, setRole] = useState('None');
    const [roleId, setRoleId] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const [chainId, setChainId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [contractConfig, setContractConfig] = useState(DEFAULT_CONFIG);

    // Load contract config — try API first (production), fall back to bundled file (dev)
    useEffect(() => {
        async function loadConfig() {
            // 1. Try fetching from backend API (works with live-deployed contract)
            try {
                const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
                const res = await fetch(`${apiBase}/blockchain/contract-config`);
                if (res.ok) {
                    const config = await res.json();
                    if (config.address && config.abi) {
                        setContractConfig(config);
                        return;
                    }
                }
            } catch {}

            // 2. Fall back to bundled contractConfig.json (local dev)
            try {
                const config = await import('../utils/contractConfig.json');
                setContractConfig(config.default || config);
            } catch (e) {
                console.warn('Contract config not found. Deploy the contract first.');
            }
        }
        loadConfig();
    }, []);

    // Set up read-only provider
    useEffect(() => {
        if (contractConfig.address === DEFAULT_CONFIG.address) return;
        try {
            const readProvider = new ethers.JsonRpcProvider(RPC_URL);
            const readContract = new ethers.Contract(contractConfig.address, contractConfig.abi, readProvider);
            setReadOnlyContract(readContract);
        } catch (e) {
            console.warn('Could not connect to read-only provider');
        }
    }, [contractConfig]);

    const connectWallet = useCallback(async () => {
        if (!window.ethereum) {
            setError('MetaMask not found. Please install MetaMask.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // ── Step 1: Force MetaMask onto the Hardhat localhost chain ──
            await ensureHardhatNetwork();

            const browserProvider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await browserProvider.send('eth_requestAccounts', []);
            const userSigner = await browserProvider.getSigner();
            const network = await browserProvider.getNetwork();

            // Override getFeeData so every tx uses near-zero gas
            const origGetFeeData = browserProvider.getFeeData.bind(browserProvider);
            browserProvider.getFeeData = async () => {
                return new ethers.FeeData(
                    1000000n,   // gasPrice  = 0.001 gwei
                    1000000n,   // maxFeePerGas
                    0n          // maxPriorityFeePerGas
                );
            };

            setProvider(browserProvider);
            setSigner(userSigner);
            setAccount(accounts[0]);
            setChainId(Number(network.chainId));
            setIsConnected(true);

            // Connect to contract
            if (contractConfig.address !== DEFAULT_CONFIG.address) {
                const userContract = new ethers.Contract(contractConfig.address, contractConfig.abi, userSigner);
                setContract(userContract);

                // Get role
                try {
                    const userRole = await userContract.getRole(accounts[0]);
                    setRoleId(Number(userRole));
                    setRole(ROLE_NAMES[Number(userRole)] || 'None');
                } catch (e) {
                    console.warn('Could not fetch role');
                }
            }
        } catch (err) {
            setError(err.message || 'Failed to connect wallet');
        } finally {
            setLoading(false);
        }
    }, [contractConfig]);

    // Listen for account/network changes
    useEffect(() => {
        if (!window.ethereum) return;

        const handleAccountsChanged = (accounts) => {
            if (accounts.length === 0) {
                setIsConnected(false);
                setAccount('');
                setRole('None');
                setRoleId(0);
            } else {
                setAccount(accounts[0]);
                if (contract) {
                    contract.getRole(accounts[0]).then(r => {
                        setRoleId(Number(r));
                        setRole(ROLE_NAMES[Number(r)] || 'None');
                    }).catch(() => { });
                }
            }
        };

        const handleChainChanged = () => window.location.reload();

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);

        return () => {
            window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
            window.ethereum.removeListener('chainChanged', handleChainChanged);
        };
    }, [contract]);

    const truncateAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    const value = {
        provider, signer, contract, readOnlyContract,
        account, role, roleId, isConnected, chainId,
        loading, error, connectWallet, truncateAddress,
        ROLE_NAMES, contractConfig
    };

    return (
        <Web3Context.Provider value={value}>
            {children}
        </Web3Context.Provider>
    );
}

export function useWeb3() {
    const context = useContext(Web3Context);
    if (!context) throw new Error('useWeb3 must be used within Web3Provider');
    return context;
}
