import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import jsQR from 'jsqr';
import {
    ArrowLeftRight, Package, Inbox, Factory, Truck, Store, Search,
    CheckCircle2, Clock, MapPin, LogIn, QrCode, Upload, Send,
    ShieldCheck, AlertTriangle, RefreshCw, Image, X, Download, ClipboardCheck,
} from 'lucide-react';
import './Transfer.css';

const STATUS_NAMES = ['Manufactured', 'In Transit (Dist)', 'At Distributor', 'In Transit (Ret)', 'At Retailer', 'Inspector Approved', 'Sold', 'Recalled', 'Flagged'];
const STATUS_COLORS = ['badge-info', 'badge-warning', 'badge-teal', 'badge-warning', 'badge-purple', 'badge-success', 'badge-success', 'badge-danger', 'badge-danger'];

const PIPELINE_STEPS = [
    { label: 'Mfg', icon: <Factory size={12} /> },
    { label: 'Transit', icon: <Truck size={12} /> },
    { label: 'Dist', icon: <Package size={12} /> },
    { label: 'Transit', icon: <Truck size={12} /> },
    { label: 'Retail', icon: <Store size={12} /> },
    { label: 'Inspect', icon: <Search size={12} /> },
    { label: 'Sold', icon: <CheckCircle2 size={12} /> },
];

export default function Transfer() {
    const { user, isAuthenticated } = useAuth();

    // ── Tab state ──
    const [activeTab, setActiveTab] = useState('send'); // 'send' | 'receive'

    // ── Sender state ──
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [location, setLocation] = useState('');
    const [loadingBatches, setLoadingBatches] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generatedQR, setGeneratedQR] = useState(null);

    // ── Receiver state ──
    const [qrPreview, setQrPreview] = useState(null);
    const [decoding, setDecoding] = useState(false);
    const [qrType, setQrType] = useState(null);      // 'transfer-token' | 'verify-url'
    const [decodedPayload, setDecodedPayload] = useState(null);
    const [autoLocation, setAutoLocation] = useState('');
    const [transferring, setTransferring] = useState(false);
    const [transferResult, setTransferResult] = useState(null);

    // ── Shared ──
    const [message, setMessage] = useState({ type: '', text: '' });
    const fileInputRef = useRef(null);

    // ── Load batches ──
    useEffect(() => { if (isAuthenticated) loadBatches(); }, [isAuthenticated]);

    async function loadBatches() {
        setLoadingBatches(true);
        try {
            const data = await api.getTransferBatches();
            setBatches(data.batches || []);
        } catch (e) {
            console.error('Failed to load batches:', e);
        } finally {
            setLoadingBatches(false);
        }
    }

    // ═══════════════════════════════════════
    // SENDER: Generate QR
    // ═══════════════════════════════════════
    async function handleGenerateQR() {
        if (!selectedBatch || !location.trim()) return;
        setGenerating(true);
        setMessage({ type: '', text: '' });
        setGeneratedQR(null);
        try {
            const result = await api.generateTransferQR(selectedBatch.batchNumber, location.trim());
            setGeneratedQR(result);
            setMessage({ type: 'success', text: `QR generated for "${result.action}" — share it with the receiver.` });
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Failed to generate QR' });
        } finally {
            setGenerating(false);
        }
    }

    function downloadQR() {
        if (!generatedQR?.qrDataUrl) return;
        const a = document.createElement('a');
        a.href = generatedQR.qrDataUrl;
        a.download = `transfer-${generatedQR.batchNumber}-${Date.now()}.png`;
        a.click();
    }

    // ═══════════════════════════════════════
    // RECEIVER: Upload & decode QR image
    // ═══════════════════════════════════════
    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;
        setDecodedPayload(null);
        setTransferResult(null);
        setMessage({ type: '', text: '' });

        const reader = new FileReader();
        reader.onload = () => {
            setQrPreview(reader.result);
            decodeQR(reader.result);
        };
        reader.readAsDataURL(file);
    }

    function decodeQR(dataUrl) {
        setDecoding(true);
        const img = new window.Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, canvas.width, canvas.height);

            if (code?.data) {
                // --- Try: PharmaChain transfer-token QR OR inspector action QR ---
                try {
                    const parsed = JSON.parse(code.data);
                    if (parsed.t === 'pharmachain-transfer') {
                        setQrType('transfer-token');
                        setDecodedPayload({ raw: code.data, parsed });
                        setMessage({ type: 'success', text: `Transfer QR decoded! Batch: ${parsed.batch} — Action: ${parsed.action}` });
                        setDecoding(false);
                        return;
                    }
                    if (parsed.t === 'pharmachain-action') {
                        setQrType('action-qr');
                        setDecodedPayload({ raw: code.data, parsed });
                        setMessage({ type: 'success', text: `Inspector QR decoded! Action: ${parsed.action} on ${parsed.batch}` });
                        setDecoding(false);
                        return;
                    }
                } catch { /* not JSON – try URL below */ }

                // --- Try: Verification QR (URL containing /verify/BATCH) ---
                const verifyMatch = code.data.match(/\/verify\/([^/?#&]+)/i);
                if (verifyMatch) {
                    const batchNumber = decodeURIComponent(verifyMatch[1]).toUpperCase();
                    setQrType('verify-url');
                    setDecodedPayload({ url: code.data, batchNumber });
                    setMessage({ type: 'success', text: `Verification QR decoded! Batch: ${batchNumber} — enter a location and execute auto-transfer.` });
                    setDecoding(false);
                    return;
                }

                setMessage({ type: 'error', text: 'QR decoded but format not recognized. Use a PharmaChain Transfer, Verification, or Inspector-Action QR.' });
            } else {
                setMessage({ type: 'error', text: 'Could not read QR code from image. Try a clearer photo.' });
            }
            setDecoding(false);
        };
        img.onerror = () => {
            setMessage({ type: 'error', text: 'Failed to load image.' });
            setDecoding(false);
        };
        img.src = dataUrl;
    }

    async function handleConfirmTransfer() {
        if (!decodedPayload) return;
        setTransferring(true);
        setMessage({ type: '', text: '' });
        setTransferResult(null);
        try {
            const result = await api.scanTransferQR(decodedPayload.raw);
            setTransferResult(result);
            setMessage({ type: 'success', text: `Transfer complete! Tx: ${result.txHash?.slice(0, 16)}...` });
            loadBatches();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Transfer failed' });
        } finally {
            setTransferring(false);
        }
    }

    async function handleActionQR() {
        if (!decodedPayload?.raw) return;
        setTransferring(true);
        setMessage({ type: '', text: '' });
        setTransferResult(null);
        try {
            const result = await api.executeActionQR(decodedPayload.raw);
            setTransferResult(result);
            setMessage({ type: 'success', text: `Inspector action complete! Tx: ${result.txHash?.slice(0, 16)}...` });
            loadBatches();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Inspector action failed' });
        } finally {
            setTransferring(false);
        }
    }

    async function handleAutoTransfer() {        if (!decodedPayload?.batchNumber || !autoLocation.trim()) return;
        setTransferring(true);
        setMessage({ type: '', text: '' });
        setTransferResult(null);
        try {
            const result = await api.autoTransferFromQR(decodedPayload.batchNumber, autoLocation.trim());
            setTransferResult(result);
            setMessage({ type: 'success', text: `Auto-transfer complete! Tx: ${result.txHash?.slice(0, 16)}...` });
            loadBatches();
        } catch (err) {
            setMessage({ type: 'error', text: err.message || 'Auto-transfer failed' });
        } finally {
            setTransferring(false);
        }
    }

    function clearReceiver() {
        setQrPreview(null);
        setDecodedPayload(null);
        setQrType(null);
        setAutoLocation('');
        setTransferResult(null);
        setMessage({ type: '', text: '' });
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    function truncAddr(addr) {
        return addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '';
    }

    const canGenerate = selectedBatch && location.trim() && !generating;

    // ── Not logged in ──
    if (!isAuthenticated) {
        return (
            <div className="page">
                <div className="empty-state">
                    <LogIn size={40} strokeWidth={1.2} style={{ opacity: 0.4, marginBottom: 12 }} />
                    <p>Please log in to manage supply chain transfers</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title"><ArrowLeftRight size={24} /> QR Supply Chain Transfer</h1>
                <p className="page-subtitle">Generate a QR to send a batch — or upload a QR to receive one</p>
            </div>

            {/* ── Tab Bar ── */}
            <div className="transfer-tabs">
                <button className={`tab-btn ${activeTab === 'send' ? 'active' : ''}`} onClick={() => { setActiveTab('send'); setMessage({ type: '', text: '' }); }}>
                    <Send size={14} /> Send Batch
                </button>
                <button className={`tab-btn ${activeTab === 'receive' ? 'active' : ''}`} onClick={() => { setActiveTab('receive'); setMessage({ type: '', text: '' }); }}>
                    <Upload size={14} /> Receive Batch
                </button>
            </div>

            {/* ═══════════════ SEND TAB ═══════════════ */}
            {activeTab === 'send' && (
                <div className="transfer-layout">
                    {/* Batch List */}
                    <div className="batch-list glass-card">
                        <h3><Package size={16} /> Select Batch</h3>
                        {loadingBatches ? (
                            <div className="loading-overlay"><div className="spinner"></div></div>
                        ) : batches.length === 0 ? (
                            <div className="empty-state"><Inbox size={36} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} /><p>No batches available</p></div>
                        ) : (
                            <div className="batch-items">
                                {batches.map((b, i) => (
                                    <div
                                        key={i}
                                        className={`batch-item ${selectedBatch?.batchNumber === b.batchNumber ? 'selected' : ''} ${b.recalled ? 'recalled' : ''}`}
                                        onClick={() => { setSelectedBatch(b); setGeneratedQR(null); setMessage({ type: '', text: '' }); }}
                                    >
                                        <div className="batch-item-name">{b.medicineName || 'Unknown'}</div>
                                        <div className="batch-item-id">{b.batchNumber}</div>
                                        <span className={`badge ${STATUS_COLORS[b.status]}`}>{STATUS_NAMES[b.status]}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Generate QR Panel */}
                    <div className="transfer-detail">
                        {selectedBatch ? (
                            <>
                                {/* Pipeline */}
                                <div className="pipeline glass-card animate-fade-up">
                                    <h3>Chain of Custody — {selectedBatch.medicineName}</h3>
                                    <div className="pipeline-visual">
                                        {PIPELINE_STEPS.map((step, i) => (
                                            <div key={i} className={`pip-node ${i <= selectedBatch.status ? 'active' : ''} ${i === selectedBatch.status ? 'current' : ''}`}>
                                                <div className="pip-dot">{i <= selectedBatch.status ? <CheckCircle2 size={10} /> : ''}</div>
                                                <span className="pip-label">{step.icon} {step.label}</span>
                                                {i < 6 && <div className={`pip-line ${i < selectedBatch.status ? 'filled' : ''}`}></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Transfer History */}
                                {(selectedBatch.supplyChain || []).length > 0 && (
                                    <div className="timeline-section glass-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
                                        <h3><Clock size={14} /> Transfer History</h3>
                                        <div className="timeline">
                                            {selectedBatch.supplyChain.map((h, i) => (
                                                <div key={i} className="timeline-item animate-slide-right" style={{ animationDelay: `${i * 0.1}s` }}>
                                                    <div className="timeline-dot"></div>
                                                    <div className="timeline-content">
                                                        <div className="timeline-status">
                                                            <span className="badge badge-info">{h.status}</span>
                                                            <span className="timeline-time">{h.date || new Date(h.timestamp * 1000).toLocaleString()}</span>
                                                        </div>
                                                        <div className="timeline-addresses">
                                                            {h.from !== '0x0000000000000000000000000000000000000000' && (
                                                                <span>From: <span className="address">{truncAddr(h.from)}</span></span>
                                                            )}
                                                            <span>To: <span className="address">{truncAddr(h.to)}</span></span>
                                                        </div>
                                                        <div className="timeline-location"><MapPin size={10} /> {h.location}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Generate QR Section */}
                                <div className="qr-generate-section glass-card animate-fade-up" style={{ animationDelay: '0.15s' }}>
                                    <h3><QrCode size={16} /> Generate Transfer QR</h3>

                                    <div className="input-group">
                                        <label>Transfer Location *</label>
                                        <input
                                            className="input-field"
                                            placeholder="e.g. Mumbai Central Warehouse"
                                            value={location}
                                            onChange={e => setLocation(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        className="btn btn-primary btn-generate"
                                        onClick={handleGenerateQR}
                                        disabled={!canGenerate}
                                    >
                                        {generating ? <><Clock size={14} /> Generating...</> : <><QrCode size={14} /> Generate QR Code</>}
                                    </button>

                                    {message.text && activeTab === 'send' && (
                                        <div className={`form-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: 12 }}>
                                            {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {message.text}
                                        </div>
                                    )}

                                    {/* Generated QR Display */}
                                    {generatedQR && (
                                        <div className="qr-result animate-fade-up">
                                            <div className="qr-image-wrapper">
                                                <img src={generatedQR.qrDataUrl} alt="Transfer QR Code" className="qr-image" />
                                            </div>
                                            <div className="qr-meta">
                                                <div className="qr-meta-row"><strong>Batch:</strong> {generatedQR.batchNumber}</div>
                                                <div className="qr-meta-row"><strong>Action:</strong> <span className="badge badge-info">{generatedQR.action}</span></div>
                                                <div className="qr-meta-row"><strong>Location:</strong> {generatedQR.location}</div>
                                                <div className="qr-meta-row"><strong>Expires:</strong> {new Date(generatedQR.expiresAt).toLocaleTimeString()}</div>
                                            </div>
                                            <button className="btn btn-secondary" onClick={downloadQR}>
                                                <Download size={14} /> Download QR
                                            </button>
                                            <p className="qr-hint">Share this QR with the receiver to complete the transfer</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
                                <Package size={48} strokeWidth={1} style={{ opacity: 0.2, marginBottom: 16 }} />
                                <p style={{ color: 'var(--text-muted)' }}>Select a batch to generate a transfer QR code</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════ RECEIVE TAB ═══════════════ */}
            {activeTab === 'receive' && (
                <div className="receive-layout">
                    <div className="receive-panel glass-card animate-fade-up">
                        <h3><Upload size={16} /> Upload QR to Transfer Batch</h3>
                        <p className="receive-subtitle">
                            Accepts <strong>three QR types</strong>: a <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Transfer Token QR</span> from the Send tab, a <span className="badge badge-teal" style={{ fontSize: '0.7rem' }}>Verification QR</span> from the Verify page, or an <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Inspector Action QR</span> from the Inspector panel — all automatically execute the on-chain action.
                        </p>

                        {/* Upload Area */}
                        <div
                            className={`qr-upload-zone ${qrPreview ? 'has-image' : ''}`}
                            onClick={() => !qrPreview && fileInputRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                    const dt = new DataTransfer();
                                    dt.items.add(file);
                                    fileInputRef.current.files = dt.files;
                                    handleFileSelect({ target: { files: [file] } });
                                }
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />

                            {qrPreview ? (
                                <div className="qr-preview-wrapper">
                                    <img src={qrPreview} alt="Uploaded QR" className="qr-preview-image" />
                                    <button className="qr-clear-btn" onClick={(e) => { e.stopPropagation(); clearReceiver(); }}>
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <Image size={48} strokeWidth={1} />
                                    <p>Click or drag & drop a QR code image</p>
                                    <span className="upload-hint">Supports PNG, JPG, WebP</span>
                                </div>
                            )}
                        </div>

                        {decoding && (
                            <div className="decoding-status">
                                <div className="spinner" style={{ width: 20, height: 20 }}></div>
                                <span>Decoding QR code...</span>
                            </div>
                        )}

                        {/* Decoded Payload Preview — Transfer Token QR */}
                        {decodedPayload && qrType === 'transfer-token' && !transferResult && (
                            <div className="decoded-info animate-fade-up">
                                <h4><ShieldCheck size={14} /> Transfer QR Details</h4>
                                <div className="decoded-grid">
                                    <div className="decoded-row"><span>Batch</span><strong>{decodedPayload.parsed.batch}</strong></div>
                                    <div className="decoded-row"><span>Action</span><strong className="badge badge-info">{decodedPayload.parsed.action}</strong></div>
                                    <div className="decoded-row"><span>Location</span><strong>{decodedPayload.parsed.loc}</strong></div>
                                    <div className="decoded-row"><span>Expires</span><strong>{new Date(decodedPayload.parsed.exp).toLocaleTimeString()}</strong></div>
                                </div>
                                <button
                                    className="btn btn-primary btn-confirm-transfer"
                                    onClick={handleConfirmTransfer}
                                    disabled={transferring}
                                >
                                    {transferring ? <><Clock size={14} /> Executing Transfer...</> : <><ArrowLeftRight size={14} /> Confirm & Execute Transfer</>}
                                </button>
                            </div>
                        )}

                        {/* Decoded Payload Preview — Inspector Action QR */}
                        {decodedPayload && qrType === 'action-qr' && !transferResult && (
                            <div className="decoded-info animate-fade-up">
                                <h4><ShieldCheck size={14} /> Inspector Action QR</h4>
                                <div className="decoded-grid">
                                    <div className="decoded-row"><span>Batch</span><strong>{decodedPayload.parsed.batch}</strong></div>
                                    <div className="decoded-row"><span>Action</span><strong className="badge badge-warning">{decodedPayload.parsed.action}</strong></div>
                                    {decodedPayload.parsed.recallReason && (
                                        <div className="decoded-row"><span>Recall Reason</span><strong>{decodedPayload.parsed.recallReason}</strong></div>
                                    )}
                                    <div className="decoded-row"><span>Generated</span><strong>{new Date(decodedPayload.parsed.ts).toLocaleTimeString()}</strong></div>
                                </div>
                                <button
                                    className="btn btn-primary btn-confirm-transfer"
                                    onClick={handleActionQR}
                                    disabled={transferring}
                                >
                                    {transferring
                                        ? <><Clock size={14} /> Executing Inspector Action...</>
                                        : <><ClipboardCheck size={14} /> Execute Inspector Action</>}
                                </button>
                                <p className="qr-hint" style={{ marginTop: 8 }}>This will execute the inspector action on-chain via the server inspector account.</p>
                            </div>
                        )}

                        {/* Decoded Payload Preview — Verification URL QR (auto-transfer) */}
                        {decodedPayload && qrType === 'verify-url' && !transferResult && (
                            <div className="decoded-info animate-fade-up">
                                <h4><ShieldCheck size={14} /> Verification QR — Auto Transfer</h4>
                                <div className="decoded-grid">
                                    <div className="decoded-row"><span>Batch</span><strong>{decodedPayload.batchNumber}</strong></div>
                                    <div className="decoded-row"><span>Mode</span><strong className="badge badge-teal">Auto-Transfer</strong></div>
                                    <div className="decoded-row"><span>Source</span><strong style={{ fontSize: '0.72rem', wordBreak: 'break-all' }}>{decodedPayload.url.slice(0, 50)}...</strong></div>
                                </div>
                                <div className="input-group" style={{ marginTop: 14 }}>
                                    <label>Transfer Location *</label>
                                    <input
                                        className="input-field"
                                        placeholder="e.g. Delhi Distribution Hub"
                                        value={autoLocation}
                                        onChange={e => setAutoLocation(e.target.value)}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary btn-confirm-transfer"
                                    onClick={handleAutoTransfer}
                                    disabled={transferring || !autoLocation.trim()}
                                >
                                    {transferring
                                        ? <><Clock size={14} /> Executing Auto Transfer...</>
                                        : <><ArrowLeftRight size={14} /> Execute Auto Transfer</>}
                                </button>
                                <p className="qr-hint" style={{ marginTop: 8 }}>The system will automatically determine the next supply chain step and execute it on-chain.</p>
                            </div>
                        )}

                        {/* Transfer Result */}
                        {transferResult && (
                            <div className="transfer-success animate-fade-up">
                                <div className="success-icon"><CheckCircle2 size={40} /></div>
                                <h4>Transfer Successful!</h4>
                                <div className="decoded-grid">
                                    <div className="decoded-row"><span>Batch</span><strong>{transferResult.batchNumber}</strong></div>
                                    <div className="decoded-row"><span>Action</span><strong>{transferResult.action}</strong></div>
                                    {transferResult.prevStatus !== undefined && (
                                        <div className="decoded-row">
                                            <span>Chain Progress</span>
                                            <strong style={{ color: 'var(--success)' }}>Step {transferResult.prevStatus} → Step {transferResult.newStatus}</strong>
                                        </div>
                                    )}
                                    <div className="decoded-row"><span>Tx Hash</span><strong className="mono">{transferResult.txHash?.slice(0, 20)}...</strong></div>
                                    <div className="decoded-row"><span>Block</span><strong>#{transferResult.blockNumber}</strong></div>
                                </div>
                                <button className="btn btn-secondary" onClick={clearReceiver} style={{ marginTop: 16 }}>
                                    <RefreshCw size={14} /> Scan Another QR
                                </button>
                            </div>
                        )}

                        {/* Message */}
                        {message.text && activeTab === 'receive' && !transferResult && (
                            <div className={`form-${message.type === 'success' ? 'success' : 'error'}`} style={{ marginTop: 12 }}>
                                {message.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />} {message.text}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
