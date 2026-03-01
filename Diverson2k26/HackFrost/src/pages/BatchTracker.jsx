import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Activity, Package, Factory, Truck, Shield, AlertTriangle,
    ArrowRight, Clock, Radio, Zap, CheckCircle2, Eye, RefreshCw,
    MapPin, Hash, Search, Filter, ChevronDown
} from 'lucide-react';
import { getAllBatches, subscribeToBatchUpdates, getRecentEvents } from '../services/api';
import './BatchTracker.css';

const STATUS_LABELS = ['Manufactured', 'In Transit (Dist)', 'At Distributor', 'In Transit (Ret)', 'At Retailer', 'Inspector Approved', 'Sold', 'Recalled', 'Flagged'];
const STATUS_ICONS = [Factory, Truck, Package, Truck, Package, Shield, CheckCircle2, AlertTriangle, AlertTriangle];
const STATUS_COLORS = ['info', 'warning', 'purple', 'warning', 'purple', 'success', 'success', 'danger', 'danger'];

export default function BatchTracker() {
    const [batches, setBatches] = useState([]);
    const [liveEvents, setLiveEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [connected, setConnected] = useState(false);
    const eventSourceRef = useRef(null);
    const feedRef = useRef(null);

    useEffect(() => {
        loadBatches();
        loadRecentEvents();

        // Subscribe to SSE
        const es = subscribeToBatchUpdates((event) => {
            setConnected(true);
            if (event.type === 'connected') return;
            setLiveEvents(prev => [event, ...prev].slice(0, 50));
            // Refresh batches on any update
            loadBatches();
        });
        eventSourceRef.current = es;
        setConnected(true);

        return () => {
            if (eventSourceRef.current) eventSourceRef.current.close();
        };
    }, []);

    async function loadBatches() {
        try {
            const data = await getAllBatches();
            setBatches(data.batches || []);
        } catch (err) {
            console.error('Failed to load batches:', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadRecentEvents() {
        try {
            const data = await getRecentEvents();
            setLiveEvents(data.events || []);
        } catch { }
    }

    const filteredBatches = batches.filter(b => {
        const statusIdx = typeof b.status === 'number' ? b.status : 0;
        const matchesFilter = filter === 'all' ||
            (filter === 'manufactured' && statusIdx === 0) ||
            (filter === 'transit' && [1, 3].includes(statusIdx)) ||
            (filter === 'delivered' && [2, 4].includes(statusIdx)) ||
            (filter === 'approved' && statusIdx === 5) ||
            (filter === 'flagged' && [7, 8].includes(statusIdx));
        const matchesSearch = !searchQuery ||
            (b.batchNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (b.medicineName || '').toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: batches.length,
        manufactured: batches.filter(b => (b.status || 0) === 0).length,
        inTransit: batches.filter(b => [1, 3].includes(b.status || 0)).length,
        approved: batches.filter(b => (b.status || 0) === 5).length,
        flagged: batches.filter(b => [7, 8].includes(b.status || 0)).length,
    };

    function getEventIcon(type) {
        switch (type) {
            case 'batch-registered': return <Package size={14} />;
            case 'batch-transferred': return <Truck size={14} />;
            case 'batch-activated': return <Zap size={14} />;
            default: return <Activity size={14} />;
        }
    }

    function getEventColor(type) {
        switch (type) {
            case 'batch-registered': return 'brand';
            case 'batch-transferred': return 'info';
            case 'batch-activated': return 'success';
            default: return 'muted';
        }
    }

    return (
        <div className="batch-tracker-page">
            {/* Header */}
            <div className="bt-header">
                <div className="bt-header-content">
                    <div className="bt-header-left">
                        <h1 className="bt-title">
                            <Activity size={28} /> Batch Tracker
                        </h1>
                        <p className="bt-subtitle">Real-time medicine batch monitoring across the supply chain</p>
                    </div>
                    <div className="bt-header-right">
                        <div className={`bt-live-indicator ${connected ? 'live' : 'offline'}`}>
                            <Radio size={12} />
                            <span>{connected ? 'Live' : 'Offline'}</span>
                        </div>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setLoading(true); loadBatches(); }}>
                            <RefreshCw size={14} /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            <div className="bt-body">
                {/* Stats Strip */}
                <div className="bt-stats-strip">
                    <div className="bt-stat" onClick={() => setFilter('all')}>
                        <div className="bt-stat-value">{stats.total}</div>
                        <div className="bt-stat-label">Total</div>
                    </div>
                    <div className="bt-stat" onClick={() => setFilter('manufactured')}>
                        <div className="bt-stat-value text-info">{stats.manufactured}</div>
                        <div className="bt-stat-label">Manufactured</div>
                    </div>
                    <div className="bt-stat" onClick={() => setFilter('transit')}>
                        <div className="bt-stat-value text-warning">{stats.inTransit}</div>
                        <div className="bt-stat-label">In Transit</div>
                    </div>
                    <div className="bt-stat" onClick={() => setFilter('approved')}>
                        <div className="bt-stat-value text-success">{stats.approved}</div>
                        <div className="bt-stat-label">Approved</div>
                    </div>
                    <div className="bt-stat" onClick={() => setFilter('flagged')}>
                        <div className="bt-stat-value text-danger">{stats.flagged}</div>
                        <div className="bt-stat-label">Flagged</div>
                    </div>
                </div>

                <div className="bt-main-grid">
                    {/* Batch List */}
                    <div className="bt-batch-list">
                        <div className="bt-list-toolbar">
                            <div className="bt-search-mini">
                                <Search size={14} />
                                <input
                                    placeholder="Search batches..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="bt-filters">
                                {['all', 'manufactured', 'transit', 'delivered', 'approved', 'flagged'].map(f => (
                                    <button
                                        key={f}
                                        className={`bt-filter-btn ${filter === f ? 'active' : ''}`}
                                        onClick={() => setFilter(f)}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="bt-loading"><Clock size={20} className="animate-spin" /> Loading batches...</div>
                        ) : filteredBatches.length === 0 ? (
                            <div className="bt-empty"><Package size={32} strokeWidth={1} /><p>No batches match your filters</p></div>
                        ) : (
                            <div className="bt-batch-grid">
                                {filteredBatches.map((b, idx) => {
                                    const statusIdx = typeof b.status === 'number' ? b.status : 0;
                                    const StatusIcon = STATUS_ICONS[statusIdx] || Package;
                                    const statusColor = STATUS_COLORS[statusIdx] || 'info';
                                    const statusLabel = b.statusLabel || STATUS_LABELS[statusIdx] || 'Unknown';
                                    return (
                                        <div key={idx} className="bt-batch-card glass-card animate-fade-up" style={{ animationDelay: `${idx * 0.04}s` }}>
                                            <div className="bt-card-header">
                                                <div className="bt-card-batch-num">
                                                    <Hash size={13} />
                                                    <span>{b.batchNumber}</span>
                                                </div>
                                                <span className={`bt-status-badge status-${statusColor}`}>
                                                    <StatusIcon size={12} /> {statusLabel}
                                                </span>
                                            </div>
                                            <div className="bt-card-medicine">{b.medicineName || 'Unknown Medicine'}</div>
                                            <div className="bt-card-details">
                                                {b.manufacturer && <div><Factory size={12} /> {b.manufacturer}</div>}
                                                {b.quantity && <div><Package size={12} /> Qty: {Number(b.quantity).toLocaleString()}</div>}
                                                {b.expiryDate && <div><Clock size={12} /> Exp: {b.expiryDate}</div>}
                                                {b.currentHolder && (
                                                    <div><MapPin size={12} /> Holder: {b.currentHolder.slice(0, 8)}...</div>
                                                )}
                                            </div>
                                            <div className="bt-card-progress">
                                                {[0, 1, 2, 3, 4, 5].map(step => (
                                                    <div key={step} className={`bt-progress-step ${statusIdx >= step ? 'done' : ''}`} />
                                                ))}
                                            </div>
                                            <div className="bt-card-actions">
                                                <Link to={`/verify/${b.batchNumber}`} className="bt-card-link">
                                                    <Eye size={13} /> View Details <ArrowRight size={12} />
                                                </Link>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Live Feed Sidebar */}
                    <div className="bt-live-feed">
                        <div className="bt-feed-header">
                            <h3><Radio size={14} /> Live Feed</h3>
                            <span className="bt-event-count">{liveEvents.length} events</span>
                        </div>
                        <div className="bt-feed-scroll" ref={feedRef}>
                            {liveEvents.length === 0 ? (
                                <div className="bt-feed-empty">
                                    <Radio size={20} />
                                    <p>Waiting for events...</p>
                                    <span>Events appear here when batches are registered or transferred</span>
                                </div>
                            ) : (
                                liveEvents.map((ev, i) => (
                                    <div key={i} className={`bt-feed-item bt-feed-${getEventColor(ev.type)}`}>
                                        <div className="bt-feed-icon">{getEventIcon(ev.type)}</div>
                                        <div className="bt-feed-body">
                                            <div className="bt-feed-title">
                                                {ev.type === 'batch-registered' && `New Batch: ${ev.data?.batchNumber || 'Unknown'}`}
                                                {ev.type === 'batch-transferred' && `Transfer: ${ev.data?.batchNumber || 'Unknown'}`}
                                                {ev.type === 'batch-activated' && `Activated: ${ev.data?.batchNumber || 'Unknown'}`}
                                                {!['batch-registered', 'batch-transferred', 'batch-activated'].includes(ev.type) && (ev.type || 'Event')}
                                            </div>
                                            <div className="bt-feed-meta">
                                                {ev.data?.medicineName && <span>{ev.data.medicineName}</span>}
                                                {ev.data?.action && <span>{ev.data.action}</span>}
                                                {ev.data?.location && <span><MapPin size={10} /> {ev.data.location}</span>}
                                            </div>
                                            <div className="bt-feed-time">
                                                {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : ''}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <div className="bt-nav-grid">
                    <Link to="/medicine-search" className="bt-nav-link">
                        <Search size={20} /> Medicine Search <ArrowRight size={14} />
                    </Link>
                    <Link to="/supply-chain" className="bt-nav-link">
                        <Truck size={20} /> Supply Chain <ArrowRight size={14} />
                    </Link>
                    <Link to="/verify" className="bt-nav-link">
                        <Shield size={20} /> Verify <ArrowRight size={14} />
                    </Link>
                    <Link to="/analytics" className="bt-nav-link">
                        <Activity size={20} /> Analytics <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
