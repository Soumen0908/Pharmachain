import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getAllMetadata } from '../services/offChainStore';
import * as api from '../services/api';
import { QRCodeCanvas } from 'qrcode.react';
import { ClipboardCheck, Clock, CheckCircle2, Flag, XCircle, AlertTriangle, Inbox, FileText, Search as SearchIcon, QrCode, Download, RefreshCw } from 'lucide-react';
import './Inspector.css';

const STATUS_NAMES = ['Manufactured', 'In Transit (Dist)', 'At Distributor', 'In Transit (Ret)', 'At Retailer', 'Inspector Approved', 'Sold', 'Recalled', 'Flagged'];
const STATUS_COLORS = ['badge-info', 'badge-warning', 'badge-teal', 'badge-warning', 'badge-purple', 'badge-success', 'badge-success', 'badge-danger', 'badge-danger'];

const FILTER_ICONS = {
    all: <FileText size={13} />,
    pending: <Clock size={13} />,
    approved: <CheckCircle2 size={13} />,
    flagged: <Flag size={13} />,
    recalled: <XCircle size={13} />,
};

export default function Inspector() {
    const { contract, account, role, roleId, isConnected, truncateAddress } = useWeb3();
    const [batches, setBatches] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    // Per-card QR state: { [batchIdHash]: { action, reason, qrData } }
    const [cardQR, setCardQR]             = useState({});
    // Per-card recall reason input
    const [cardReason, setCardReason]     = useState({});
    // Per-card action loading
    const [cardLoading, setCardLoading]   = useState({});
    // Per-card execution result
    const [cardResult, setCardResult]     = useState({});

    useEffect(() => { loadBatches(); }, [contract]);

    async function loadBatches() {
        if (!contract) { setLoading(false); return; }
        try {
            const allIds = await contract.getAllBatchIds();
            const metadata = getAllMetadata();
            const list = [];
            for (const id of allIds) {
                const d = await contract.getBatchDetails(id);
                const h = await contract.getBatchHistory(id);
                const meta = Object.values(metadata).find(m => m.batchIdHash === id);
                list.push({
                    batchIdHash: id,
                    manufacturer: d[2],
                    currentHolder: d[3],
                    status: Number(d[4]),
                    inspectorApproved: d[8],
                    recalled: d[11],
                    recallReason: d[12],
                    createdAt: Number(d[13]),
                    historyCount: h.length,
                    meta,
                });
            }
            setBatches(list);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    /** Generate a QR payload for an inspector action and store it in state */
    function generateActionQR(b, action) {
        const reason = cardReason[b.batchIdHash] || '';
        if (action === 'recallBatch' && !reason.trim()) {
            setMessage({ type: 'error', text: 'Enter a recall reason before generating the Recall QR.' });
            return;
        }
        const qrData = JSON.stringify({
            t: 'pharmachain-action',
            action,
            batch: b.meta?.batchId || b.batchIdHash,
            batchHash: b.batchIdHash,
            ...(action === 'recallBatch' && { recallReason: reason }),
            ts: Date.now(),
        });
        setCardQR(prev => ({ ...prev, [b.batchIdHash]: { action, qrData } }));
        setCardResult(prev => ({ ...prev, [b.batchIdHash]: null }));
        setMessage({ type: '', text: '' });
    }

    function downloadCardQR(b) {
        const canvas = document.getElementById(`insp-qr-${b.batchIdHash}`);
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `inspector-action-${b.meta?.batchId || b.batchIdHash.slice(0, 8)}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }

    async function executeCardQR(b) {
        const qrEntry = cardQR[b.batchIdHash];
        if (!qrEntry) return;
        setCardLoading(prev => ({ ...prev, [b.batchIdHash]: true }));
        try {
            const result = await api.executeActionQR(qrEntry.qrData);
            setCardResult(prev => ({ ...prev, [b.batchIdHash]: { ok: true, ...result } }));
            loadBatches();
        } catch (err) {
            setCardResult(prev => ({ ...prev, [b.batchIdHash]: { ok: false, error: err.message } }));
        } finally {
            setCardLoading(prev => ({ ...prev, [b.batchIdHash]: false }));
        }
    }

    const filtered = batches.filter(b => {
        if (filter === 'pending') return b.status === 4 && !b.inspectorApproved;
        if (filter === 'approved') return b.inspectorApproved;
        if (filter === 'flagged') return b.status === 8;
        if (filter === 'recalled') return b.recalled;
        return true;
    });

    if (!isConnected || roleId !== 4) {
        return <div className="page"><div className="empty-state"><SearchIcon size={40} strokeWidth={1.2} style={{ opacity: 0.4, marginBottom: 12 }} /><p>Only verified Inspectors can access this page</p></div></div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Inspector Panel</h1>
                <p className="page-subtitle">Approve, flag, or recall drug batches. Your approval is required before retail sale.</p>
            </div>

            {/* Filters */}
            <div className="inspector-filters animate-fade-up">
                {['all', 'pending', 'approved', 'flagged', 'recalled'].map(f => (
                    <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                        {FILTER_ICONS[f]}
                        {' '}{f.charAt(0).toUpperCase() + f.slice(1)} ({batches.filter(b => {
                            if (f === 'pending') return b.status === 4 && !b.inspectorApproved;
                            if (f === 'approved') return b.inspectorApproved;
                            if (f === 'flagged') return b.status === 8;
                            if (f === 'recalled') return b.recalled;
                            return true;
                        }).length})
                    </button>
                ))}
            </div>

            {message.text && (
                <div className={`form-${message.type === 'success' ? 'success' : 'error'} animate-fade-up`} style={{ marginBottom: '16px' }}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="loading-overlay"><div className="spinner"></div><p>Loading batches...</p></div>
            ) : (
                <div className="inspector-grid">
                    {filtered.length === 0 ? (
                        <div className="empty-state"><Inbox size={36} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} /><p>No batches match this filter</p></div>
                    ) : (
                        filtered.map((b, i) => {
                            const qrEntry    = cardQR[b.batchIdHash];
                            const result     = cardResult[b.batchIdHash];
                            const loading_   = cardLoading[b.batchIdHash];
                            return (
                            <div key={i} className={`inspector-card glass-card animate-fade-up ${b.recalled ? 'card-recalled' : ''} ${b.status === 8 ? 'card-flagged' : ''}`}
                                style={{ animationDelay: `${i * 0.05}s` }}>
                                <div className="icard-header">
                                    <div>
                                        <div className="icard-name">{b.meta?.drugName || 'Unknown Drug'}</div>
                                        <div className="icard-id mono">{b.meta?.batchId || b.batchIdHash.slice(0, 16) + '...'}</div>
                                    </div>
                                    <span className={`badge ${STATUS_COLORS[b.status]}`}>{STATUS_NAMES[b.status]}</span>
                                </div>
                                <div className="icard-details">
                                    <div><span>Manufacturer:</span> <span className="address">{truncateAddress(b.manufacturer)}</span></div>
                                    <div><span>Holder:</span> <span className="address">{truncateAddress(b.currentHolder)}</span></div>
                                    <div><span>Steps:</span> {b.historyCount}</div>
                                    <div><span>Created:</span> {new Date(b.createdAt * 1000).toLocaleDateString()}</div>
                                    {b.recalled && <div className="recall-reason">Recall: {b.recallReason}</div>}
                                </div>

                                {/* ── QR-only Actions ── */}
                                {!b.recalled && !b.inspectorApproved && b.status !== 7 && (
                                    <div className="icard-actions">
                                        {/* Recall reason input (always shown for recall option) */}
                                        <div className="recall-input" style={{ marginBottom: 8 }}>
                                            <input
                                                className="input-field"
                                                placeholder="Recall reason (required for Recall QR)..."
                                                value={cardReason[b.batchIdHash] || ''}
                                                onChange={e => setCardReason(prev => ({ ...prev, [b.batchIdHash]: e.target.value }))}
                                                style={{ fontSize: '0.8rem' }}
                                            />
                                        </div>

                                        {/* Action QR generation buttons */}
                                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                            {b.status === 4 && (
                                                <button className="btn btn-primary btn-sm" onClick={() => generateActionQR(b, 'inspectAndApprove')}>
                                                    <QrCode size={13} /> Generate Approve QR
                                                </button>
                                            )}
                                            {b.status !== 8 && (
                                                <button className="btn btn-secondary btn-sm" onClick={() => generateActionQR(b, 'flagBatch')}>
                                                    <QrCode size={13} /> Generate Flag QR
                                                </button>
                                            )}
                                            <button className="btn btn-danger btn-sm" onClick={() => generateActionQR(b, 'recallBatch')}>
                                                <QrCode size={13} /> Generate Recall QR
                                            </button>
                                        </div>

                                        {/* QR Canvas + Execute */}
                                        {qrEntry && (
                                            <div className="icard-qr-section" style={{ marginTop: 12, textAlign: 'center' }}>
                                                <div style={{ display: 'inline-block', padding: 8, background: '#fff', borderRadius: 8 }}>
                                                    <QRCodeCanvas
                                                        id={`insp-qr-${b.batchIdHash}`}
                                                        value={qrEntry.qrData}
                                                        size={160}
                                                        level="H"
                                                    />
                                                </div>
                                                <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                                    Action: <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{qrEntry.action}</span>
                                                    <span style={{ marginLeft: 8, color: 'var(--warning)', fontSize: '0.7rem' }}>Valid 10 min</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => downloadCardQR(b)}>
                                                        <Download size={13} /> Save QR
                                                    </button>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => executeCardQR(b)}
                                                        disabled={loading_}
                                                    >
                                                        {loading_ ? <><Clock size={13} /> Executing...</> : <><CheckCircle2 size={13} /> Execute via QR</>}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Execution result */}
                                        {result && (
                                            <div className={`form-${result.ok ? 'success' : 'error'}`} style={{ marginTop: 8, fontSize: '0.78rem' }}>
                                                {result.ok
                                                    ? <><CheckCircle2 size={12} /> Done! Tx: {result.txHash?.slice(0, 18)}...</>
                                                    : <><AlertTriangle size={12} /> {result.error}</>}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {b.inspectorApproved && (
                                    <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--success)' }}>
                                        <CheckCircle2 size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Inspector Approved
                                    </div>
                                )}
                            </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
