import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { registerBatch, getMyBatches } from '../services/api';
import { PlusCircle, CheckCircle2, Clock, AlertTriangle, Pill, Inbox, Key, Package, Calendar, DollarSign, Beaker, Hash, Factory, Download, Shield } from 'lucide-react';
import './Manufacturer.css';

export default function Manufacturer() {
    const { user, isAuthenticated, isManufacturer } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        medicineName: '', batchNumber: '', composition: '', dosageForm: 'Tablet',
        mfgDate: '', expiryDate: '', quantity: '', mrp: '',
    });
    const [createdBatch, setCreatedBatch] = useState(null);
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingBatches, setFetchingBatches] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) { navigate('/login/manufacturer'); return; }
        if (!isManufacturer) { navigate('/'); return; }
        loadBatches();
    }, [isAuthenticated, isManufacturer]);

    async function loadBatches() {
        setFetchingBatches(true);
        try {
            const data = await getMyBatches();
            setBatches(data.batches || []);
        } catch (err) {
            console.error('Failed to load batches:', err);
        } finally {
            setFetchingBatches(false);
        }
    }

    async function handleCreate(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await registerBatch({
                ...form,
                manufacturerName: user.companyName || user.name,
            });

            setCreatedBatch(data.batch);
            toast.success('✅ Batch registered on blockchain!');
            setForm({ medicineName: '', batchNumber: '', composition: '', dosageForm: 'Tablet', mfgDate: '', expiryDate: '', quantity: '', mrp: '' });
            loadBatches();
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    }

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const STATUS_LABELS = {
        'Manufactured': { color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
        'In Transit (to Distributor)': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
        'At Distributor': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
        'In Transit (to Retailer)': { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
        'At Retailer': { color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
        'Inspector Approved': { color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
        'Sold': { color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
        'Recalled': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
        'Flagged': { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    };

    if (!isAuthenticated || !isManufacturer) return null;

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Manufacturer Dashboard</h1>
                <p className="page-subtitle">
                    Welcome, <strong>{user.companyName || user.name}</strong> — Register medicine batches on blockchain
                </p>
            </div>

            <div className="mfg-layout">
                {/* Create Batch Form */}
                <div className="mfg-form-section glass-card animate-fade-up">
                    <h3><PlusCircle size={18} /> Register New Batch</h3>
                    <form onSubmit={handleCreate}>
                        <div className="input-group">
                            <label><Pill size={14} /> Medicine Name *</label>
                            <input className="input-field" placeholder="e.g. Paracetamol 500mg"
                                value={form.medicineName} onChange={set('medicineName')} required />
                        </div>
                        <div className="input-group">
                            <label><Hash size={14} /> Batch Number *</label>
                            <input className="input-field" placeholder="e.g. CIPLA-PCM-2026-001"
                                value={form.batchNumber} onChange={set('batchNumber')} required />
                        </div>
                        <div className="input-group">
                            <label><Beaker size={14} /> Composition *</label>
                            <input className="input-field" placeholder="e.g. Paracetamol 500mg + Caffeine 65mg"
                                value={form.composition} onChange={set('composition')} required />
                        </div>
                        <div className="form-row">
                            <div className="input-group">
                                <label>Dosage Form</label>
                                <select className="input-field" value={form.dosageForm} onChange={set('dosageForm')}>
                                    <option>Tablet</option>
                                    <option>Capsule</option>
                                    <option>Syrup</option>
                                    <option>Injection</option>
                                    <option>Ointment</option>
                                    <option>Drops</option>
                                    <option>Inhaler</option>
                                </select>
                            </div>
                            <div className="input-group">
                                <label><Package size={14} /> Quantity *</label>
                                <input type="number" className="input-field" placeholder="e.g. 50000"
                                    value={form.quantity} onChange={set('quantity')} required min="1" />
                            </div>
                        </div>
                        <div className="form-row">
                            <div className="input-group">
                                <label><Calendar size={14} /> Manufacturing Date *</label>
                                <input type="date" className="input-field"
                                    value={form.mfgDate} onChange={set('mfgDate')} required />
                            </div>
                            <div className="input-group">
                                <label><Calendar size={14} /> Expiry Date *</label>
                                <input type="date" className="input-field"
                                    value={form.expiryDate} onChange={set('expiryDate')} required />
                            </div>
                        </div>
                        <div className="input-group">
                            <label><DollarSign size={14} /> MRP (₹)</label>
                            <input type="number" step="0.01" className="input-field" placeholder="e.g. 5.50"
                                value={form.mrp} onChange={set('mrp')} />
                        </div>

                        {error && <div className="form-error"><AlertTriangle size={13} /> {error}</div>}

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '16px' }}>
                            {loading ? <><Clock size={16} /> Registering on Blockchain...</> : <><PlusCircle size={16} /> Register Batch</>}
                        </button>
                    </form>
                </div>

                {/* QR + Scratch Code Result */}
                <div className="mfg-result-section">
                    {createdBatch ? (
                        <div className="qr-result glass-card animate-fade-up">
                            <h3><CheckCircle2 size={16} /> Batch Registered!</h3>
                            <div className="qr-display">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        batchId: createdBatch.batchNumber,
                                        qrHash: createdBatch.qrHash,
                                        medicine: createdBatch.medicineName,
                                    })}
                                    size={200}
                                    bgColor="transparent"
                                    fgColor="#06b6d4"
                                    level="H"
                                />
                            </div>
                            <div className="scratch-display">
                                <label><Key size={14} /> One-Time Scratch Code</label>
                                <div className="scratch-code">{createdBatch.scratchCode}</div>
                                <p className="scratch-warning">
                                    <AlertTriangle size={12} /> This code is shown ONLY ONCE. Print it for medicine packaging.
                                </p>
                            </div>
                            <div className="batch-summary">
                                <div><strong>Medicine:</strong> {createdBatch.medicineName}</div>
                                <div><strong>Batch:</strong> {createdBatch.batchNumber}</div>
                                <div><strong>QR Hash:</strong> <span className="mono">{createdBatch.qrHash?.slice(0, 16)}...</span></div>
                                <div><strong>TX Hash:</strong> <span className="mono">{createdBatch.txHash?.slice(0, 16)}...</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="qr-placeholder glass-card">
                            <Pill size={48} strokeWidth={1} style={{ opacity: 0.2, marginBottom: 16 }} className="animate-float" />
                            <p>Register a batch to generate QR code and scratch code</p>
                        </div>
                    )}
                </div>
            </div>

            {/* My Batches Table */}
            <div className="my-batches animate-fade-up" style={{ animationDelay: '0.3s' }}>
                <h3><Package size={18} /> My Registered Batches ({batches.length})</h3>
                {fetchingBatches ? (
                    <div className="empty-state"><Clock size={24} className="animate-spin" /><p>Loading batches...</p></div>
                ) : batches.length === 0 ? (
                    <div className="empty-state"><Inbox size={36} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} /><p>No batches registered yet</p></div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Batch Number</th>
                                    <th>Medicine</th>
                                    <th>Composition</th>
                                    <th>MFG Date</th>
                                    <th>Expiry</th>
                                    <th>Qty</th>
                                    <th>MRP</th>
                                    <th>Status</th>
                                    <th>Registered</th>
                                </tr>
                            </thead>
                            <tbody>
                                {batches.map((b, i) => {
                                    const status = b.blockchain?.status || 'Manufactured';
                                    const style = STATUS_LABELS[status] || STATUS_LABELS['Manufactured'];
                                    return (
                                        <tr key={i}>
                                            <td className="mono">{b.batchNumber}</td>
                                            <td><strong>{b.medicineName}</strong></td>
                                            <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.composition}</td>
                                            <td>{b.mfgDate}</td>
                                            <td>{b.expiryDate}</td>
                                            <td>{Number(b.quantity).toLocaleString()}</td>
                                            <td>₹{b.mrp || '—'}</td>
                                            <td>
                                                <span className="status-badge" style={{ color: style.color, background: style.bg, padding: '3px 10px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 600 }}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                                                {new Date(b.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
