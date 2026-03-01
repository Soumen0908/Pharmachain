import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Truck, Factory, Package, Shield, CheckCircle2, MapPin,
    ArrowRight, ArrowDown, Clock, Search, Hash, Eye, AlertTriangle,
    Activity, Building2, ShoppingBag, Microscope, Radio
} from 'lucide-react';
import { getAllBatches, subscribeToBatchUpdates } from '../services/api';
import './SupplyChain.css';

const STAGES = [
    { label: 'Manufactured', icon: Factory, color: 'info', desc: 'Batch created at factory' },
    { label: 'Shipped to Distributor', icon: Truck, color: 'warning', desc: 'In transit' },
    { label: 'At Distributor', icon: Building2, color: 'purple', desc: 'Received at warehouse' },
    { label: 'Shipped to Retailer', icon: Truck, color: 'warning', desc: 'In transit' },
    { label: 'At Retailer', icon: ShoppingBag, color: 'purple', desc: 'Available at store' },
    { label: 'Inspector Approved', icon: Microscope, color: 'success', desc: 'Quality verified' },
];

export default function SupplyChain() {
    const [batches, setBatches] = useState([]);
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [liveUpdates, setLiveUpdates] = useState([]);

    useEffect(() => {
        loadBatches();
        const es = subscribeToBatchUpdates((event) => {
            if (event.type === 'batch-transferred' || event.type === 'batch-registered') {
                setLiveUpdates(prev => [event, ...prev].slice(0, 20));
                loadBatches();
            }
        });
        return () => es.close();
    }, []);

    async function loadBatches() {
        try {
            const data = await getAllBatches();
            const batchList = data.batches || [];
            setBatches(batchList);
            if (batchList.length > 0 && !selectedBatch) {
                setSelectedBatch(batchList[0]);
            }
        } catch (err) {
            console.error('Failed to load supply chain data:', err);
        } finally {
            setLoading(false);
        }
    }

    const filtered = batches.filter(b =>
        !searchQuery ||
        (b.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.medicineName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groupedByStatus = {};
    STAGES.forEach((_, i) => { groupedByStatus[i] = []; });
    batches.forEach(b => {
        const idx = typeof b.status === 'number' ? Math.min(b.status, 5) : 0;
        if (groupedByStatus[idx]) groupedByStatus[idx].push(b);
    });

    return (
        <div className="supply-chain-page">
            {/* Header */}
            <div className="sc-header">
                <div className="sc-header-inner">
                    <div>
                        <h1 className="sc-title"><Truck size={28} /> Supply Chain</h1>
                        <p className="sc-subtitle">Visualize medicine journey from factory to pharmacy</p>
                    </div>
                    <div className="sc-header-actions">
                        <div className="sc-live-dot"><Radio size={12} /> Live Updates</div>
                    </div>
                </div>
            </div>

            <div className="sc-body">
                {/* Pipeline Visualization */}
                <div className="sc-pipeline">
                    <h3 className="sc-section-title">Supply Chain Pipeline</h3>
                    <div className="sc-pipeline-flow">
                        {STAGES.map((stage, idx) => {
                            const StageIcon = stage.icon;
                            const count = groupedByStatus[idx]?.length || 0;
                            return (
                                <React.Fragment key={idx}>
                                    <div className={`sc-stage-card sc-stage-${stage.color}`}>
                                        <div className="sc-stage-icon"><StageIcon size={22} /></div>
                                        <div className="sc-stage-info">
                                            <div className="sc-stage-label">{stage.label}</div>
                                            <div className="sc-stage-desc">{stage.desc}</div>
                                        </div>
                                        <div className="sc-stage-count">{count}</div>
                                    </div>
                                    {idx < STAGES.length - 1 && (
                                        <div className="sc-connector">
                                            <ArrowRight size={20} />
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                <div className="sc-content-grid">
                    {/* Batch List */}
                    <div className="sc-batch-panel">
                        <div className="sc-panel-header">
                            <h3>All Batches ({batches.length})</h3>
                            <div className="sc-panel-search">
                                <Search size={13} />
                                <input
                                    placeholder="Filter..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="sc-batch-scroll">
                            {loading ? (
                                <div className="sc-loading"><Clock size={18} className="animate-spin" /> Loading...</div>
                            ) : filtered.length === 0 ? (
                                <div className="sc-empty-list">No batches found</div>
                            ) : (
                                filtered.map((b, i) => {
                                    const isActive = selectedBatch?.batchNumber === b.batchNumber;
                                    const statusIdx = typeof b.status === 'number' ? b.status : 0;
                                    return (
                                        <button
                                            key={i}
                                            className={`sc-batch-item ${isActive ? 'active' : ''}`}
                                            onClick={() => setSelectedBatch(b)}
                                        >
                                            <div className="sc-item-primary">
                                                <Hash size={12} />
                                                <span className="sc-item-batch">{b.batchNumber}</span>
                                            </div>
                                            <div className="sc-item-medicine">{b.medicineName}</div>
                                            <div className="sc-item-status">
                                                <span className={`sc-mini-badge sc-mini-${STAGES[Math.min(statusIdx, 5)]?.color}`}>
                                                    {STAGES[Math.min(statusIdx, 5)]?.label}
                                                </span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Selected Batch Detail & Timeline */}
                    <div className="sc-detail-panel">
                        {selectedBatch ? (
                            <>
                                <div className="sc-detail-header glass-card">
                                    <h3>{selectedBatch.medicineName || 'Unknown Medicine'}</h3>
                                    <div className="sc-detail-meta">
                                        <span><Hash size={13} /> {selectedBatch.batchNumber}</span>
                                        {selectedBatch.manufacturer && <span><Factory size={13} /> {selectedBatch.manufacturer}</span>}
                                        {selectedBatch.quantity && <span><Package size={13} /> Qty: {Number(selectedBatch.quantity).toLocaleString()}</span>}
                                        {selectedBatch.expiryDate && <span><Clock size={13} /> Exp: {selectedBatch.expiryDate}</span>}
                                    </div>
                                </div>

                                {/* Timeline */}
                                <div className="sc-timeline">
                                    <h4>Journey Timeline</h4>
                                    {STAGES.map((stage, idx) => {
                                        const statusIdx = typeof selectedBatch.status === 'number' ? selectedBatch.status : 0;
                                        const isCompleted = idx <= statusIdx;
                                        const isCurrent = idx === statusIdx;
                                        const StageIcon = stage.icon;
                                        return (
                                            <div key={idx} className={`sc-timeline-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                                                <div className="sc-timeline-marker">
                                                    {isCompleted ? <CheckCircle2 size={18} /> : <div className="sc-timeline-dot" />}
                                                </div>
                                                <div className="sc-timeline-content">
                                                    <div className="sc-timeline-label">
                                                        <StageIcon size={14} /> {stage.label}
                                                    </div>
                                                    <div className="sc-timeline-desc">{stage.desc}</div>
                                                    {isCurrent && <span className="sc-current-badge">Current Stage</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Link to={`/verify/${selectedBatch.batchNumber}`} className="btn btn-primary" style={{ width: '100%', marginTop: 16, display: 'flex', justifyContent: 'center', gap: 8 }}>
                                    <Eye size={16} /> View Full Details <ArrowRight size={14} />
                                </Link>
                            </>
                        ) : (
                            <div className="sc-no-selection">
                                <Package size={40} strokeWidth={1} />
                                <p>Select a batch to view its supply chain journey</p>
                            </div>
                        )}
                    </div>

                    {/* Live Updates */}
                    <div className="sc-updates-panel">
                        <div className="sc-updates-header">
                            <h3><Radio size={14} /> Recent Activity</h3>
                        </div>
                        <div className="sc-updates-list">
                            {liveUpdates.length === 0 ? (
                                <div className="sc-empty-updates">
                                    <Activity size={20} />
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                liveUpdates.map((ev, i) => (
                                    <div key={i} className="sc-update-item">
                                        <div className="sc-update-dot" />
                                        <div>
                                            <div className="sc-update-title">
                                                {ev.data?.batchNumber}: {ev.data?.action || ev.type}
                                            </div>
                                            {ev.data?.location && <div className="sc-update-loc"><MapPin size={10} /> {ev.data.location}</div>}
                                            <div className="sc-update-time">{new Date(ev.timestamp).toLocaleTimeString()}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="sc-nav">
                    <Link to="/batch-tracker" className="sc-nav-btn"><Activity size={18} /> Batch Tracker <ArrowRight size={14} /></Link>
                    <Link to="/transfer" className="sc-nav-btn"><Truck size={18} /> Transfer Batches <ArrowRight size={14} /></Link>
                    <Link to="/manufacturer" className="sc-nav-btn"><Factory size={18} /> Register Batch <ArrowRight size={14} /></Link>
                    <Link to="/medicine-search" className="sc-nav-btn"><Search size={18} /> Medicine Search <ArrowRight size={14} /></Link>
                </div>
            </div>
        </div>
    );
}
