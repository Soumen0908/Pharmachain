import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { getAllMetadata } from '../services/offChainStore';
import { Package, Factory, Truck, ShieldCheck, AlertTriangle, Flag, Zap, PlusCircle, ArrowLeftRight, Search, QrCode, BarChart3, FileText, Wallet, Clock, CheckCircle2 } from 'lucide-react';
import './Dashboard.css';

const STATUS_NAMES = ['Manufactured', 'In Transit (Dist)', 'At Distributor', 'In Transit (Ret)', 'At Retailer', 'Inspector Approved', 'Sold', 'Recalled', 'Flagged'];
const STATUS_COLORS = ['badge-info', 'badge-warning', 'badge-teal', 'badge-warning', 'badge-purple', 'badge-success', 'badge-success', 'badge-danger', 'badge-danger'];

export default function Dashboard() {
    const { contract, account, role, roleId, isConnected, truncateAddress } = useWeb3();
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, manufactured: 0, inTransit: 0, sold: 0, recalled: 0, flagged: 0 });

    useEffect(() => {
        loadBatches();
    }, [contract, account]);

    async function loadBatches() {
        if (!contract) { setLoading(false); return; }
        try {
            const allIds = await contract.getAllBatchIds();
            const metadata = getAllMetadata();
            const batchList = [];

            for (const id of allIds) {
                try {
                    const details = await contract.getBatchDetails(id);
                    batchList.push({
                        batchIdHash: id,
                        metadataHash: details[1],
                        manufacturer: details[2],
                        currentHolder: details[3],
                        status: Number(details[4]),
                        activated: details[5],
                        activatedBy: details[6],
                        inspectorApproved: details[8],
                        recalled: details[11],
                        recallReason: details[12],
                        createdAt: Number(details[13]),
                        metadata: Object.values(metadata).find(m => m.batchIdHash === id) || null,
                    });
                } catch (e) { console.warn('Error loading batch', e); }
            }

            setBatches(batchList);
            setStats({
                total: batchList.length,
                manufactured: batchList.filter(b => b.status === 0).length,
                inTransit: batchList.filter(b => [1, 3].includes(b.status)).length,
                sold: batchList.filter(b => b.status === 6).length,
                recalled: batchList.filter(b => b.status === 7).length,
                flagged: batchList.filter(b => b.status === 8).length,
            });
        } catch (e) {
            console.error('Failed to load batches:', e);
        } finally {
            setLoading(false);
        }
    }

    if (!isConnected) {
        return (
            <div className="page">
                <div className="empty-state">
                    <Wallet size={40} strokeWidth={1.2} style={{ opacity: 0.4, marginBottom: 12 }} />
                    <h2>Connect Your Wallet</h2>
                    <p>Connect MetaMask to access your role-based dashboard</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="page">
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <div className="flex-between">
                    <div>
                        <h1 className="page-title">Dashboard</h1>
                        <p className="page-subtitle">
                            Welcome, <span className="badge badge-info">{role}</span>
                            {' '}<span className="address">{truncateAddress(account)}</span>
                        </p>
                    </div>
                    {roleId === 1 && (
                        <Link to="/manufacturer" className="btn btn-primary"><PlusCircle size={16} /> Create Batch</Link>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="dashboard-stats">
                <div className="stat-card animate-fade-up">
                    <div className="stat-icon"><Package size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{stats.total}</div>
                    <div className="stat-label">Total Batches</div>
                </div>
                <div className="stat-card animate-fade-up stagger-1">
                    <div className="stat-icon"><Factory size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{stats.manufactured}</div>
                    <div className="stat-label">Manufactured</div>
                </div>
                <div className="stat-card animate-fade-up stagger-2">
                    <div className="stat-icon"><Truck size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{stats.inTransit}</div>
                    <div className="stat-label">In Transit</div>
                </div>
                <div className="stat-card animate-fade-up stagger-3">
                    <div className="stat-icon"><CheckCircle2 size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{stats.sold}</div>
                    <div className="stat-label">Sold</div>
                </div>
                {stats.recalled > 0 && (
                    <div className="stat-card animate-fade-up stagger-4">
                        <div className="stat-icon"><AlertTriangle size={22} strokeWidth={1.5} /></div>
                        <div className="stat-value">{stats.recalled}</div>
                        <div className="stat-label">Recalled</div>
                    </div>
                )}
                {stats.flagged > 0 && (
                    <div className="stat-card animate-fade-up stagger-5">
                        <div className="stat-icon"><Flag size={22} strokeWidth={1.5} /></div>
                        <div className="stat-value">{stats.flagged}</div>
                        <div className="stat-label">Flagged</div>
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="section-title-sm"><Zap size={14} /> Quick Actions</div>
            <div className="role-actions">
                {roleId === 1 && <>
                    <Link to="/manufacturer" className="role-card">
                        <div className="card-icon"><PlusCircle size={24} strokeWidth={1.5} /></div>
                        <div className="card-title">Create Batch</div>
                        <div className="card-desc">Register a new medicine batch</div>
                    </Link>
                    <Link to="/transfer" className="role-card">
                        <div className="card-icon"><ArrowLeftRight size={24} strokeWidth={1.5} /></div>
                        <div className="card-title">Transfer Batch</div>
                        <div className="card-desc">Send to distributor</div>
                    </Link>
                </>}
                {roleId === 2 && <>
                    <Link to="/transfer" className="role-card">
                        <div className="card-icon"><Package size={24} strokeWidth={1.5} /></div>
                        <div className="card-title">Receive Batches</div>
                        <div className="card-desc">View incoming shipments</div>
                    </Link>
                    <Link to="/transfer" className="role-card">
                        <div className="card-icon"><ArrowLeftRight size={24} strokeWidth={1.5} /></div>
                        <div className="card-title">Forward to Retailer</div>
                        <div className="card-desc">Transfer downstream</div>
                    </Link>
                </>}
                {roleId === 3 && (
                    <Link to="/transfer" className="role-card">
                        <div className="card-icon"><Package size={24} strokeWidth={1.5} /></div>
                        <div className="card-title">Receive Batches</div>
                        <div className="card-desc">View incoming batches</div>
                    </Link>
                )}
                {roleId === 4 && <>
                    <Link to="/inspector" className="role-card">
                        <div className="card-icon"><Search size={24} strokeWidth={1.5} /></div>
                        <div className="card-title">Inspect Batches</div>
                        <div className="card-desc">Approve or reject batches</div>
                    </Link>
                    <Link to="/analytics" className="role-card">
                        <div className="card-icon"><BarChart3 size={24} strokeWidth={1.5} /></div>
                        <div className="card-title">View Analytics</div>
                        <div className="card-desc">Supply chain insights</div>
                    </Link>
                </>}
                <Link to="/verify" className="role-card">
                    <div className="card-icon"><ShieldCheck size={24} strokeWidth={1.5} /></div>
                    <div className="card-title">Verify Product</div>
                    <div className="card-desc">Check medicine authenticity</div>
                </Link>
                <Link to="/scan" className="role-card">
                    <div className="card-icon"><QrCode size={24} strokeWidth={1.5} /></div>
                    <div className="card-title">Scan QR Code</div>
                    <div className="card-desc">Quick QR verification</div>
                </Link>
            </div>

            {/* Recent Batches */}
            <div className="section-title-sm"><FileText size={14} /> Recent Batches</div>
            {batches.length === 0 ? (
                <div className="empty-state">
                    <Package size={36} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
                    <p>No batches found. {roleId === 1 ? 'Create your first batch!' : 'Waiting for batches.'}</p>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Batch ID</th>
                                <th>Drug Name</th>
                                <th>Status</th>
                                <th>Holder</th>
                                <th>Inspector</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {batches.slice(0, 10).map((b, i) => (
                                <tr key={i}>
                                    <td className="mono truncate" style={{ maxWidth: '140px' }}>{b.batchIdHash.slice(0, 16)}...</td>
                                    <td>{b.metadata?.drugName || '—'}</td>
                                    <td><span className={`badge ${STATUS_COLORS[b.status]}`}>{STATUS_NAMES[b.status]}</span></td>
                                    <td className="mono">{truncateAddress(b.currentHolder)}</td>
                                    <td>{b.inspectorApproved ? <CheckCircle2 size={14} className="text-success" /> : <Clock size={14} className="text-muted" />}</td>
                                    <td>{new Date(b.createdAt * 1000).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

        </div>
    );
}
