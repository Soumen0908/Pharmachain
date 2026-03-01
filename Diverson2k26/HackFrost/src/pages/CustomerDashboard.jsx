import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { getMedicineBatches, verifyBatch, getAllBatches, subscribeToBatchUpdates } from '../services/api';
import { Search, Pill, Shield, ShieldCheck, ShieldX, Package, Calendar, Factory, MapPin, DollarSign, Clock, ChevronDown, ChevronUp, AlertTriangle, Beaker, Hash, Truck, Radio } from 'lucide-react';
import './CustomerDashboard.css';

export default function CustomerDashboard() {
    const { user } = useAuth();
    const toast = useToast();

    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState(null);
    const [allBatches, setAllBatches] = useState([]);
    const [loadingAll, setLoadingAll] = useState(true);
    const [expandedBatch, setExpandedBatch] = useState(null);
    const [verifyResult, setVerifyResult] = useState(null);
    const [verifyInput, setVerifyInput] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [liveEvents, setLiveEvents] = useState([]);
    const eventSourceRef = useRef(null);

    // Load all batches on mount + subscribe to SSE
    useEffect(() => {
        loadAllBatches();

        // SSE real-time subscription
        const es = subscribeToBatchUpdates((event) => {
            setLiveEvents(prev => [event, ...prev].slice(0, 20));
            // Auto-refresh batch list on new events
            loadAllBatches();
        });
        eventSourceRef.current = es;

        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    async function loadAllBatches() {
        setLoadingAll(true);
        try {
            const data = await getAllBatches();
            setAllBatches(data.batches || []);
        } catch (err) {
            console.error('Failed to load batches:', err);
        } finally {
            setLoadingAll(false);
        }
    }

    async function handleSearch(e) {
        e?.preventDefault();
        if (!searchQuery.trim()) return;
        setSearching(true);
        setResults(null);
        try {
            const data = await getMedicineBatches(searchQuery.trim());
            setResults(data);
            if (data.totalBatches === 0) toast.info('No batches found for this medicine');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSearching(false);
        }
    }

    async function handleVerify(e) {
        e?.preventDefault();
        if (!verifyInput.trim()) return;
        setVerifying(true);
        setVerifyResult(null);
        try {
            const data = await verifyBatch(verifyInput.trim());
            setVerifyResult(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setVerifying(false);
        }
    }

    // Group all batches by medicine name for browse view
    const groupedByMedicine = allBatches.reduce((acc, b) => {
        const name = b.medicineName || 'Unknown';
        if (!acc[name]) acc[name] = [];
        acc[name].push(b);
        return acc;
    }, {});

    return (
        <div className="page customer-dashboard">
            <div className="page-header">
                <h1 className="page-title">Medicine Verification</h1>
                <p className="page-subtitle">
                    Search for any medicine to see all registered batches from all manufacturers, or verify a specific batch.
                </p>
            </div>

            {/* Search + Verify Sections */}
            <div className="cd-dual-section">
                {/* Medicine Search */}
                <div className="cd-search-card glass-card animate-fade-up">
                    <h3><Search size={18} /> Search Medicine</h3>
                    <p className="cd-hint">Find all batches of a medicine from every manufacturer</p>
                    <form onSubmit={handleSearch} className="cd-search-form">
                        <div className="cd-search-input-wrap">
                            <Search size={18} className="cd-search-icon" />
                            <input
                                type="text"
                                className="cd-search-input"
                                placeholder="Type medicine name... e.g. Paracetamol"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={searching}>
                            {searching ? <><Clock size={15} /> Searching...</> : <><Search size={15} /> Search</>}
                        </button>
                    </form>
                </div>

                {/* Verify by QR Hash / Batch Number */}
                <div className="cd-verify-card glass-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <h3><Shield size={18} /> Verify Medicine</h3>
                    <p className="cd-hint">Enter batch number, QR hash, or scratch code to verify</p>
                    <form onSubmit={handleVerify} className="cd-search-form">
                        <div className="cd-search-input-wrap">
                            <Shield size={18} className="cd-search-icon" />
                            <input
                                type="text"
                                className="cd-search-input"
                                placeholder="Enter batch number or QR hash..."
                                value={verifyInput}
                                onChange={(e) => setVerifyInput(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={verifying}>
                            {verifying ? <><Clock size={15} /> Verifying...</> : <><ShieldCheck size={15} /> Verify</>}
                        </button>
                    </form>
                </div>
            </div>

            {/* Verification Result */}
            {verifyResult && (
                <div className={`cd-verify-result glass-card animate-fade-up ${verifyResult.verified ? 'genuine' : 'counterfeit'}`}>
                    <div className="cd-verify-header">
                        {verifyResult.verified ? (
                            <>
                                <ShieldCheck size={40} className="cd-verify-icon genuine" />
                                <div>
                                    <h2 className="cd-verify-status genuine">
                                        {verifyResult.status === 'RECALLED' ? '⚠️ RECALLED' : '✅ GENUINE'}
                                    </h2>
                                    <p>This medicine is verified on the blockchain</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <ShieldX size={40} className="cd-verify-icon counterfeit" />
                                <div>
                                    <h2 className="cd-verify-status counterfeit">❌ NOT VERIFIED</h2>
                                    <p>{verifyResult.message}</p>
                                </div>
                            </>
                        )}
                    </div>
                    {verifyResult.medicine && (
                        <div className="cd-verify-details">
                            <div className="cd-detail-row"><Pill size={14} /><span>Medicine:</span><strong>{verifyResult.medicine.name}</strong></div>
                            <div className="cd-detail-row"><Beaker size={14} /><span>Composition:</span><strong>{verifyResult.medicine.composition}</strong></div>
                            <div className="cd-detail-row"><Factory size={14} /><span>Manufacturer:</span><strong>{verifyResult.medicine.manufacturer}</strong></div>
                            <div className="cd-detail-row"><Hash size={14} /><span>Batch:</span><strong>{verifyResult.medicine.batchNumber}</strong></div>
                            <div className="cd-detail-row"><Calendar size={14} /><span>MFG:</span><strong>{verifyResult.medicine.mfgDate}</strong></div>
                            <div className="cd-detail-row"><Calendar size={14} /><span>Expiry:</span><strong>{verifyResult.medicine.expiryDate}</strong></div>
                            <div className="cd-detail-row"><Package size={14} /><span>Quantity:</span><strong>{Number(verifyResult.medicine.quantity).toLocaleString()}</strong></div>
                            <div className="cd-detail-row"><DollarSign size={14} /><span>MRP:</span><strong>₹{verifyResult.medicine.mrp}</strong></div>
                        </div>
                    )}
                    {verifyResult.supplyChain?.length > 0 && (
                        <div className="cd-supply-chain">
                            <h4><Truck size={16} /> Supply Chain Timeline</h4>
                            <div className="cd-timeline">
                                {verifyResult.supplyChain.map((step, i) => (
                                    <div key={i} className="cd-timeline-step">
                                        <div className="cd-timeline-dot"></div>
                                        <div className="cd-timeline-content">
                                            <strong>{step.status}</strong>
                                            <span className="cd-timeline-location"><MapPin size={12} /> {step.location}</span>
                                            <span className="cd-timeline-date">{step.date ? new Date(step.date).toLocaleString() : ''}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Search Results */}
            {results && (
                <div className="cd-results animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <h3>
                        <Package size={18} />
                        {results.totalBatches} batch{results.totalBatches !== 1 ? 'es' : ''} found for "{results.medicineName}"
                    </h3>
                    {results.batches?.length > 0 ? (
                        <div className="cd-batch-grid">
                            {results.batches.map((b, i) => (
                                <div key={i} className="cd-batch-card glass-card" onClick={() => setExpandedBatch(expandedBatch === i ? null : i)}>
                                    <div className="cd-batch-header">
                                        <div>
                                            <h4>{b.medicineName}</h4>
                                            <span className="cd-batch-mfr"><Factory size={13} /> {b.manufacturer}</span>
                                        </div>
                                        <span className={`cd-batch-status ${b.recalled ? 'recalled' : b.inspectorApproved ? 'approved' : 'active'}`}>
                                            {b.recalled ? 'RECALLED' : b.inspectorApproved ? 'APPROVED' : b.statusLabel || 'Manufactured'}
                                        </span>
                                    </div>
                                    <div className="cd-batch-info">
                                        <div><Hash size={13} /> <span>Batch:</span> {b.batchNumber}</div>
                                        <div><Beaker size={13} /> <span>Composition:</span> {b.composition}</div>
                                        <div><Calendar size={13} /> <span>MFG:</span> {b.mfgDate} → <span>Expiry:</span> {b.expiryDate}</div>
                                        <div><Package size={13} /> <span>Qty:</span> {Number(b.quantity).toLocaleString()} | <DollarSign size={13} /> <span>MRP:</span> ₹{b.mrp || '—'}</div>
                                    </div>
                                    <div className="cd-batch-expand-icon">
                                        {expandedBatch === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Pill size={36} style={{ opacity: 0.3 }} />
                            <p>No batches found</p>
                        </div>
                    )}
                </div>
            )}

            {/* Live Batch Updates */}
            {liveEvents.length > 0 && (
                <div className="cd-live-feed glass-card animate-fade-up">
                    <h3><Radio size={18} className="cd-live-pulse" /> Live Batch Updates</h3>
                    <div className="cd-live-list">
                        {liveEvents.map((evt, i) => (
                            <div key={i} className={`cd-live-item ${evt.type}`}>
                                <span className="cd-live-dot"></span>
                                <div className="cd-live-content">
                                    <strong>{evt.type === 'batch-registered' ? 'New Batch Registered' : evt.type === 'batch-transferred' ? 'Batch Transferred' : evt.type}</strong>
                                    <span>{evt.data?.medicineName || evt.data?.batchNumber || 'Batch update'}</span>
                                    {evt.data?.batchNumber && <small>Batch: {evt.data.batchNumber}</small>}
                                </div>
                                <time>{new Date(evt.timestamp).toLocaleTimeString()}</time>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Browse All Registered Medicines */}
            {!results && (
                <div className="cd-browse animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <h3><Pill size={18} /> All Registered Medicines</h3>
                    {loadingAll ? (
                        <div className="empty-state"><Clock size={24} className="animate-spin" /><p>Loading...</p></div>
                    ) : Object.keys(groupedByMedicine).length === 0 ? (
                        <div className="empty-state"><Pill size={36} style={{ opacity: 0.3 }} /><p>No medicines registered yet. Manufacturers need to register batches first.</p></div>
                    ) : (
                        <div className="cd-medicine-grid">
                            {Object.entries(groupedByMedicine).map(([name, mBatches]) => (
                                <div key={name} className="cd-medicine-card glass-card"
                                    onClick={() => { setSearchQuery(name); setResults({ medicineName: name, totalBatches: mBatches.length, batches: mBatches }); }}>
                                    <div className="cd-med-icon"><Pill size={24} /></div>
                                    <h4>{name}</h4>
                                    <div className="cd-med-info">
                                        <span><Factory size={13} /> {new Set(mBatches.map(b => b.manufacturer)).size} manufacturer(s)</span>
                                        <span><Package size={13} /> {mBatches.length} batch(es)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
