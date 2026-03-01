import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTransactionHistory, getAllBatches } from '../services/api';
import {
    History, RefreshCw, Search, Filter, ArrowRightLeft, Package,
    Clock, Hash, MapPin, ExternalLink, ChevronDown, ChevronUp,
    Database, AlertCircle, CheckCircle2, Truck, ShieldCheck
} from 'lucide-react';
import './TransactionHistory.css';

const ACTION_LABELS = {
    transferToDistributor: { label: 'Transfer → Distributor', color: '#3b82f6', icon: <Truck size={14} /> },
    acknowledgeByDistributor: { label: 'Acknowledged by Distributor', color: '#8b5cf6', icon: <CheckCircle2 size={14} /> },
    transferToRetailer: { label: 'Transfer → Retailer', color: '#06b6d4', icon: <Truck size={14} /> },
    acknowledgeByRetailer: { label: 'Acknowledged by Retailer', color: '#10b981', icon: <CheckCircle2 size={14} /> },
    inspectAndApprove: { label: 'Inspected & Approved', color: '#f59e0b', icon: <ShieldCheck size={14} /> },
    flagBatch: { label: 'Flagged', color: '#ef4444', icon: <AlertCircle size={14} /> },
    scratchActivation: { label: 'Scratch Activated', color: '#ec4899', icon: <Package size={14} /> },
    registered: { label: 'Batch Registered', color: '#6366f1', icon: <Package size={14} /> },
};

function getActionMeta(action) {
    return ACTION_LABELS[action] || { label: action, color: '#64748b', icon: <ArrowRightLeft size={14} /> };
}

function truncateHash(hash) {
    if (!hash) return '—';
    return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

function formatDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
        ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function TransactionHistory() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [source, setSource] = useState('');

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState('all');
    const [sortOrder, setSortOrder] = useState('desc');
    const [expandedRow, setExpandedRow] = useState(null);

    // Batch list for filter dropdown
    const [batchList, setBatchList] = useState([]);
    const [batchFilter, setBatchFilter] = useState('all');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        setLoading(true);
        setError(null);
        try {
            const [historyRes, batchRes] = await Promise.all([
                getTransactionHistory({ limit: 200 }),
                getAllBatches().catch(() => ({ batches: [] })),
            ]);
            setTransactions(historyRes.transactions || []);
            setSource(historyRes.source || 'unknown');
            setBatchList(batchRes.batches || []);
        } catch (err) {
            console.error('Failed to load transaction history:', err);
            setError(err.message || 'Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    }

    // Filtered + sorted transactions
    const filtered = useMemo(() => {
        let result = [...transactions];

        // Search filter (batch number, medicine name, tx hash, location)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                (t.batch_number || '').toLowerCase().includes(q) ||
                (t.medicine_name || '').toLowerCase().includes(q) ||
                (t.tx_hash || '').toLowerCase().includes(q) ||
                (t.location || '').toLowerCase().includes(q)
            );
        }

        // Action filter
        if (actionFilter !== 'all') {
            result = result.filter(t => t.action === actionFilter);
        }

        // Batch filter
        if (batchFilter !== 'all') {
            result = result.filter(t => t.batch_number === batchFilter);
        }

        // Sort
        result.sort((a, b) => {
            const da = new Date(a.timestamp);
            const db = new Date(b.timestamp);
            return sortOrder === 'desc' ? db - da : da - db;
        });

        return result;
    }, [transactions, searchQuery, actionFilter, batchFilter, sortOrder]);

    // Unique actions for filter dropdown
    const uniqueActions = useMemo(() => {
        const set = new Set(transactions.map(t => t.action));
        return [...set].sort();
    }, [transactions]);

    // Stats
    const stats = useMemo(() => ({
        total: transactions.length,
        transfers: transactions.filter(t => t.action?.includes('transfer') || t.action?.includes('Transfer')).length,
        activations: transactions.filter(t => t.action === 'scratchActivation').length,
        inspections: transactions.filter(t => t.action === 'inspectAndApprove').length,
    }), [transactions]);

    if (loading) {
        return (
            <div className="page">
                <div className="loading-overlay">
                    <div className="spinner"></div>
                    <p>Loading transaction history...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title"><History size={26} /> Transaction History</h1>
                <p className="page-subtitle">
                    Complete audit trail of all supply-chain transfers & actions stored in Supabase
                </p>
            </div>

            {/* Stats Row */}
            <div className="txh-stats animate-fade-up">
                <div className="txh-stat-card">
                    <div className="txh-stat-icon"><Database size={20} /></div>
                    <div className="txh-stat-value">{stats.total}</div>
                    <div className="txh-stat-label">Total Transactions</div>
                </div>
                <div className="txh-stat-card">
                    <div className="txh-stat-icon"><Truck size={20} /></div>
                    <div className="txh-stat-value">{stats.transfers}</div>
                    <div className="txh-stat-label">Transfers</div>
                </div>
                <div className="txh-stat-card">
                    <div className="txh-stat-icon"><Package size={20} /></div>
                    <div className="txh-stat-value">{stats.activations}</div>
                    <div className="txh-stat-label">Activations</div>
                </div>
                <div className="txh-stat-card">
                    <div className="txh-stat-icon"><ShieldCheck size={20} /></div>
                    <div className="txh-stat-value">{stats.inspections}</div>
                    <div className="txh-stat-label">Inspections</div>
                </div>
            </div>

            {/* Filters */}
            <div className="txh-filters animate-fade-up" style={{ animationDelay: '0.1s' }}>
                <div className="txh-search">
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search batch, medicine, tx hash, location..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="txh-filter-group">
                    <label><Filter size={14} /> Action</label>
                    <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
                        <option value="all">All Actions</option>
                        {uniqueActions.map(a => (
                            <option key={a} value={a}>{getActionMeta(a).label}</option>
                        ))}
                    </select>
                </div>

                <div className="txh-filter-group">
                    <label><Package size={14} /> Batch</label>
                    <select value={batchFilter} onChange={e => setBatchFilter(e.target.value)}>
                        <option value="all">All Batches</option>
                        {batchList.map(b => (
                            <option key={b.batchNumber} value={b.batchNumber}>
                                {b.batchNumber} — {b.medicineName}
                            </option>
                        ))}
                    </select>
                </div>

                <button className="txh-sort-btn" onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}>
                    <Clock size={14} />
                    {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
                    {sortOrder === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </button>

                <button className="txh-refresh-btn" onClick={loadData} disabled={loading}>
                    <RefreshCw size={14} className={loading ? 'spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Source badge */}
            <div className="txh-source animate-fade-up" style={{ animationDelay: '0.15s' }}>
                <Database size={12} />
                Source: <strong>{source}</strong> &middot; Showing {filtered.length} of {transactions.length} transactions
            </div>

            {/* Error */}
            {error && (
                <div className="txh-error">
                    <AlertCircle size={16} /> {error}
                    <button onClick={loadData}>Retry</button>
                </div>
            )}

            {/* Table */}
            {filtered.length === 0 ? (
                <div className="txh-empty animate-fade-up">
                    <History size={48} strokeWidth={1} />
                    <h3>No Transactions Found</h3>
                    <p>{transactions.length === 0 ? 'No transactions recorded yet. Transfer some batches to see history here.' : 'No transactions match your current filters.'}</p>
                </div>
            ) : (
                <div className="txh-table-wrapper animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <table className="txh-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Action</th>
                                <th>Batch</th>
                                <th>Medicine</th>
                                <th>Location</th>
                                <th>Tx Hash</th>
                                <th>Time</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((tx, idx) => {
                                const meta = getActionMeta(tx.action);
                                const isExpanded = expandedRow === idx;
                                return (
                                    <React.Fragment key={tx.tx_hash || idx}>
                                        <tr
                                            className={`txh-row ${isExpanded ? 'expanded' : ''}`}
                                            onClick={() => setExpandedRow(isExpanded ? null : idx)}
                                        >
                                            <td className="txh-idx">{idx + 1}</td>
                                            <td>
                                                <span className="txh-action-badge" style={{ '--action-color': meta.color }}>
                                                    {meta.icon}
                                                    {meta.label}
                                                </span>
                                            </td>
                                            <td>
                                                <Link
                                                    to={`/verify/${tx.batch_number}`}
                                                    className="txh-batch-link"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {tx.batch_number || '—'}
                                                </Link>
                                            </td>
                                            <td className="txh-medicine">{tx.medicine_name || '—'}</td>
                                            <td className="txh-location">
                                                {tx.location ? (
                                                    <span><MapPin size={12} /> {tx.location}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="txh-hash">
                                                <code>{truncateHash(tx.tx_hash)}</code>
                                            </td>
                                            <td className="txh-time">{formatDate(tx.timestamp)}</td>
                                            <td className="txh-expand">
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </td>
                                        </tr>
                                        {isExpanded && (
                                            <tr className="txh-detail-row">
                                                <td colSpan="8">
                                                    <div className="txh-details">
                                                        <div className="txh-detail-grid">
                                                            <div className="txh-detail-item">
                                                                <span className="txh-detail-label">Full Tx Hash</span>
                                                                <code className="txh-detail-value">{tx.tx_hash || '—'}</code>
                                                            </div>
                                                            <div className="txh-detail-item">
                                                                <span className="txh-detail-label">Block Number</span>
                                                                <span className="txh-detail-value">{tx.block_number || '—'}</span>
                                                            </div>
                                                            <div className="txh-detail-item">
                                                                <span className="txh-detail-label">From Address</span>
                                                                <code className="txh-detail-value">{tx.from_address || '—'}</code>
                                                            </div>
                                                            <div className="txh-detail-item">
                                                                <span className="txh-detail-label">To Address</span>
                                                                <code className="txh-detail-value">{tx.to_address || '—'}</code>
                                                            </div>
                                                            <div className="txh-detail-item">
                                                                <span className="txh-detail-label">Signer Index</span>
                                                                <span className="txh-detail-value">{tx.signer_index ?? '—'}</span>
                                                            </div>
                                                            <div className="txh-detail-item">
                                                                <span className="txh-detail-label">Batch ID Hash</span>
                                                                <code className="txh-detail-value">{truncateHash(tx.batch_id_hash)}</code>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
