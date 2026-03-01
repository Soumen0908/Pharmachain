import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../context/Web3Context';
import { Settings, Wallet, Lock, Clock, KeyRound } from 'lucide-react';
import './Admin.css';

const ROLE_MAP = {
    Manufacturer: 1,
    Distributor: 2,
    Retailer: 3,
    Inspector: 4,
    Auditor: 5,
};

export default function Admin() {
    const { contract, account, isConnected, truncateAddress } = useWeb3();
    const [newAddress, setNewAddress] = useState('');
    const [newRole, setNewRole] = useState('Manufacturer');
    const [grantedRoles, setGrantedRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => { checkOwner(); }, [contract, account]);

    async function checkOwner() {
        if (!contract || !account) return;
        try {
            const owner = await contract.owner();
            setIsOwner(owner.toLowerCase() === account.toLowerCase());
        } catch (e) { console.error(e); }
    }

    async function handleGrant(e) {
        e.preventDefault();
        if (!ethers.isAddress(newAddress)) {
            setMessage({ type: 'error', text: 'Invalid Ethereum address' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const tx = await contract.grantRole(newAddress, ROLE_MAP[newRole], { maxFeePerGas: 1000000, maxPriorityFeePerGas: 0 });
            await tx.wait();
            setGrantedRoles(prev => [...prev, { address: newAddress, role: newRole }]);
            setMessage({ type: 'success', text: `${newRole} role granted to ${newAddress.slice(0, 10)}...` });
            setNewAddress('');
        } catch (err) {
            setMessage({ type: 'error', text: err.reason || err.message || 'Failed to grant role' });
        } finally { setLoading(false); }
    }

    if (!isConnected) {
        return <div className="page"><div className="empty-state"><Wallet size={40} strokeWidth={1.2} style={{ opacity: 0.4, marginBottom: 12 }} /><p>Connect wallet to access Admin</p></div></div>;
    }

    if (!isOwner) {
        return <div className="page"><div className="empty-state"><Lock size={40} strokeWidth={1.2} style={{ opacity: 0.4, marginBottom: 12 }} /><p>Only the contract owner can access this page</p></div></div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Admin Panel</h1>
                <p className="page-subtitle">Manage roles and system configuration</p>
            </div>

            <div className="admin-layout">
                <div className="admin-form glass-card animate-fade-up">
                    <h3>Grant Role</h3>
                    <form onSubmit={handleGrant}>
                        <div className="input-group">
                            <label>Ethereum Address</label>
                            <input className="input-field" placeholder="0x..." value={newAddress}
                                onChange={e => setNewAddress(e.target.value)} required />
                        </div>
                        <div className="input-group">
                            <label>Role</label>
                            <select className="input-field" value={newRole} onChange={e => setNewRole(e.target.value)}>
                                {Object.keys(ROLE_MAP).map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        {message.text && (
                            <div className={`form-${message.type}`}>{message.text}</div>
                        )}

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
                            {loading ? <><Clock size={16} /> Granting...</> : <><KeyRound size={16} /> Grant Role</>}
                        </button>
                    </form>
                </div>

                <div className="admin-info glass-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <h3>Role Hierarchy</h3>
                    <div className="role-list">
                        {Object.entries(ROLE_MAP).map(([name, id]) => (
                            <div key={id} className="role-item">
                                <div className={`role-badge-admin badge-${name.toLowerCase()}`}>{name}</div>
                                <div className="role-desc">
                                    {name === 'Manufacturer' && 'Create & register drug batches on-chain'}
                                    {name === 'Distributor' && 'Receive & forward batches in supply chain'}
                                    {name === 'Retailer' && 'Receive batches & sell to consumers'}
                                    {name === 'Inspector' && 'Approve, flag, or recall batches'}
                                    {name === 'Auditor' && 'Read-only compliance & analytics access'}
                                </div>
                            </div>
                        ))}
                    </div>

                    {grantedRoles.length > 0 && (
                        <>
                            <h4 style={{ marginTop: '20px', marginBottom: '12px', color: 'var(--text-bright)' }}>Recent Grants</h4>
                            <div className="grants-list">
                                {grantedRoles.map((g, i) => (
                                    <div key={i} className="grant-item">
                                        <span className={`badge badge-${g.role.toLowerCase()}`}>{g.role}</span>
                                        <span className="address">{truncateAddress(g.address)}</span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
