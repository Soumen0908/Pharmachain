import React, { useState, useEffect, useRef } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { Factory, Package, Search, CheckCircle2, AlertTriangle, Unlock, MapPin } from 'lucide-react';
import './LiveFeed.css';

const EVENT_TYPES = [
    { type: 'created', Icon: Factory, label: 'Batch Created', color: 'var(--accent-teal)' },
    { type: 'transferred', Icon: Package, label: 'Batch Transferred', color: 'var(--accent-blue)' },
    { type: 'inspected', Icon: Search, label: 'Inspector Approved', color: 'var(--success)' },
    { type: 'verified', Icon: CheckCircle2, label: 'Product Verified', color: 'var(--accent-purple)' },
    { type: 'recalled', Icon: AlertTriangle, label: 'Batch Recalled', color: 'var(--danger)' },
    { type: 'activated', Icon: Unlock, label: 'Product Activated', color: 'var(--warning)' },
];

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const DRUGS = ['Paracetamol', 'Amoxicillin', 'Metformin', 'Aspirin', 'Ibuprofen', 'Azithromycin'];

function generateEvent() {
    const evt = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    const city = CITIES[Math.floor(Math.random() * CITIES.length)];
    const drug = DRUGS[Math.floor(Math.random() * DRUGS.length)];
    const batchId = `${drug.slice(0, 3).toUpperCase()}-2026-${String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')}`;
    return {
        ...evt,
        id: Date.now() + Math.random(),
        batchId,
        drug,
        city,
        timestamp: new Date(),
    };
}

export default function LiveFeed({ maxItems = 8 }) {
    const { contract } = useWeb3();
    const [events, setEvents] = useState([]);
    const intervalRef = useRef(null);

    useEffect(() => {
        const initial = Array.from({ length: 4 }).map(() => {
            const e = generateEvent();
            e.timestamp = new Date(Date.now() - Math.random() * 60000);
            return e;
        });
        setEvents(initial);

        intervalRef.current = setInterval(() => {
            setEvents(prev => {
                const next = [generateEvent(), ...prev];
                return next.slice(0, maxItems);
            });
        }, 4000 + Math.random() * 3000);

        return () => clearInterval(intervalRef.current);
    }, [maxItems]);

    useEffect(() => {
        if (!contract) return;
        try {
            const handler = (batchId, manufacturer) => {
                setEvents(prev => [{
                    type: 'created', Icon: Factory, label: 'Batch Created',
                    color: 'var(--accent-teal)', id: Date.now(),
                    batchId: batchId.slice(0, 16) + '...',
                    drug: 'On-Chain', city: 'Blockchain',
                    timestamp: new Date(),
                }, ...prev].slice(0, maxItems));
            };
            contract.on('BatchCreated', handler);
            return () => contract.off('BatchCreated', handler);
        } catch (e) { /* contract events not available */ }
    }, [contract, maxItems]);

    function timeAgo(date) {
        const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    }

    return (
        <div className="live-feed">
            <div className="live-feed-header">
                <div className="live-dot-wrap">
                    <span className="live-dot"></span>
                    <span>Live Activity</span>
                </div>
                <span className="live-count">{events.length} events</span>
            </div>
            <div className="live-feed-list">
                {events.map((event, i) => {
                    const EventIcon = event.Icon;
                    return (
                        <div key={event.id} className="feed-item" style={{
                            animationDelay: i === 0 ? '0s' : 'none',
                            borderLeftColor: event.color,
                        }}>
                            <div className="feed-icon"><EventIcon size={16} /></div>
                            <div className="feed-content">
                                <div className="feed-title">
                                    <span style={{ color: event.color }}>{event.label}</span>
                                    <span className="feed-time">{timeAgo(event.timestamp)}</span>
                                </div>
                                <div className="feed-meta">
                                    <span className="mono">{event.batchId}</span>
                                    <span><MapPin size={10} /> {event.city}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
