import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getCounterfeitHeatmap } from '../services/riskEngine';
import { getAllScans } from '../services/offChainStore';
import { generateTemperatureLog, analyzeColdChain } from '../services/coldChain';
import { Package, Search, Globe, AlertTriangle, Map, RefreshCw, Thermometer, Bot, TrendingUp, CheckCircle2, Info } from 'lucide-react';
import InteractiveMap from '../components/InteractiveMap';
import './Analytics.css';

export default function Analytics() {
    const { contract, isConnected } = useWeb3();
    const [batchCount, setBatchCount] = useState(0);
    const [heatmapData, setHeatmapData] = useState([]);
    const [coldChainData, setColdChainData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { loadData(); }, [contract]);

    async function loadData() {
        try {
            if (contract) {
                const count = await contract.getBatchCount();
                setBatchCount(Number(count));
            }
            setHeatmapData(getCounterfeitHeatmap());
            const logs = generateTemperatureLog('VACCINE-001', true);
            setColdChainData({ logs, analysis: analyzeColdChain(logs) });
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const allScans = getAllScans();
    const totalScans = Object.values(allScans).reduce((sum, arr) => sum + arr.length, 0);
    const maxRisk = Math.max(...heatmapData.map(r => r.risk), 0);

    if (loading) {
        return <div className="page"><div className="loading-overlay"><div className="spinner"></div><p>Loading analytics...</p></div></div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Enterprise Analytics</h1>
                <p className="page-subtitle">Counterfeit intelligence, supply chain insights, and risk monitoring</p>
            </div>

            {/* Top Stats */}
            <div className="analytics-stats animate-fade-up">
                <div className="stat-card">
                    <div className="stat-icon"><Package size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{batchCount}</div>
                    <div className="stat-label">Batches Tracked</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Search size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{totalScans}</div>
                    <div className="stat-label">Total Scans</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><Globe size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{heatmapData.length}</div>
                    <div className="stat-label">Regions Monitored</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon"><AlertTriangle size={22} strokeWidth={1.5} /></div>
                    <div className="stat-value">{heatmapData.filter(r => r.risk > 30).length}</div>
                    <div className="stat-label">High Risk Zones</div>
                </div>
            </div>

            <div className="analytics-grid">
                {/* Counterfeit Heatmap */}
                <div className="analytics-section animate-fade-up" style={{ animationDelay: '0.1s' }}>
                    <h3><Map size={16} /> Counterfeit Risk Heatmap</h3>
                    <p className="section-note">AI-predicted counterfeit probability by region</p>
                    <InteractiveMap heatmapData={heatmapData} />
                    <div style={{ marginTop: '20px' }}>
                        <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Regional Breakdown</h4>
                        <div className="heatmap-grid">
                            {heatmapData.map((region, i) => (
                                <div key={i} className="heatmap-bar" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="bar-track">
                                        <div className="bar-fill" style={{
                                            height: `${(region.risk / maxRisk) * 100}%`,
                                            background: region.risk > 40 ? 'var(--danger)' : region.risk > 20 ? 'var(--warning)' : 'var(--success)',
                                        }}></div>
                                    </div>
                                    <div className="bar-label">{region.name}</div>
                                    <div className="bar-value" style={{
                                        color: region.risk > 40 ? 'var(--danger)' : region.risk > 20 ? 'var(--warning)' : 'var(--success)'
                                    }}>{region.risk}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Supply Flow */}
                <div className="analytics-section animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    <h3><RefreshCw size={16} /> Supply Chain Flow</h3>
                    <p className="section-note">Batch distribution across supply chain stages</p>
                    <div className="supply-flow">
                        {[
                            { label: 'Manufactured', icon: <Package size={18} />, count: batchCount, color: 'var(--brand)' },
                            { label: 'In Distribution', icon: <RefreshCw size={18} />, count: Math.max(1, Math.floor(batchCount * 0.6)), color: 'var(--info)' },
                            { label: 'At Retailers', icon: <Globe size={18} />, count: Math.max(1, Math.floor(batchCount * 0.4)), color: 'var(--purple)' },
                            { label: 'Sold/Verified', icon: <CheckCircle2 size={18} />, count: Math.max(0, Math.floor(batchCount * 0.2)), color: 'var(--success)' },
                        ].map((stage, i) => (
                            <div key={i} className="flow-step">
                                <div className="flow-step-icon" style={{ color: stage.color }}>{stage.icon}</div>
                                <div className="flow-step-info">
                                    <div className="flow-step-count" style={{ color: stage.color }}>{stage.count}</div>
                                    <div className="flow-step-label">{stage.label}</div>
                                </div>
                                <div className="flow-step-bar">
                                    <div className="flow-step-fill" style={{ width: `${(stage.count / Math.max(batchCount, 1)) * 100}%`, background: stage.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cold Chain */}
                {coldChainData && (
                    <div className="analytics-section animate-fade-up" style={{ animationDelay: '0.3s' }}>
                        <h3><Thermometer size={16} /> Cold Chain Monitor (Vaccine Batch)</h3>
                        <p className="section-note">Simulated IoT temperature monitoring for sensitive drugs</p>
                        <div className="cold-chain-stats">
                            <div className={`cold-stat ${coldChainData.analysis.status === 'optimal' ? 'cold-good' : coldChainData.analysis.status === 'warning' ? 'cold-warn' : 'cold-bad'}`}>
                                <span className="cold-stat-value">{coldChainData.analysis.avgTemp}°C</span>
                                <span className="cold-stat-label">Avg Temp</span>
                            </div>
                            <div className="cold-stat">
                                <span className="cold-stat-value">{coldChainData.analysis.minTemp}°C – {coldChainData.analysis.maxTemp}°C</span>
                                <span className="cold-stat-label">Range</span>
                            </div>
                            <div className={`cold-stat ${coldChainData.analysis.excursionCount > 0 ? 'cold-warn' : 'cold-good'}`}>
                                <span className="cold-stat-value">{coldChainData.analysis.excursionCount}</span>
                                <span className="cold-stat-label">Excursions</span>
                            </div>
                            <div className="cold-stat">
                                <span className="cold-stat-value" style={{
                                    color: coldChainData.analysis.status === 'optimal' ? 'var(--success)' :
                                        coldChainData.analysis.status === 'warning' ? 'var(--warning)' : 'var(--danger)'
                                }}>{coldChainData.analysis.status.toUpperCase()}</span>
                                <span className="cold-stat-label">Status</span>
                            </div>
                        </div>
                        <div className="chart-area">
                            <div className="chart-safe-zone">Safe Zone: 2°C – 8°C</div>
                            <div className="chart-bars">
                                {coldChainData.logs.map((log, i) => (
                                    <div key={i} className="chart-bar-wrap" title={`${log.temperature}°C at ${new Date(log.timestamp).toLocaleTimeString()}`}>
                                        <div className="chart-bar" style={{
                                            height: `${Math.max(5, (log.temperature / 15) * 100)}%`,
                                            background: log.excursion ? 'var(--danger)' : 'var(--brand)',
                                        }}></div>
                                    </div>
                                ))}
                            </div>
                            <div className="chart-time-axis">
                                <span>24h ago</span>
                                <span>Now</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Smart Alerts */}
                <div className="analytics-section animate-fade-up" style={{ animationDelay: '0.4s' }}>
                    <h3><Bot size={16} /> Smart Alerts</h3>
                    <div className="alert-feed">
                        <div className="alert-card alert-warning">
                            <span className="alert-icon-sm"><AlertTriangle size={16} /></span>
                            <div>
                                <strong>Extended Hold Detected</strong>
                                <p>Batch AMX-2026-002 has been at distributor for over 7 days without forwarding</p>
                            </div>
                        </div>
                        <div className="alert-card alert-info">
                            <span className="alert-icon-sm"><TrendingUp size={16} /></span>
                            <div>
                                <strong>Scan Spike</strong>
                                <p>Kolkata region shows 42% increase in verification scans over 24h</p>
                            </div>
                        </div>
                        <div className="alert-card alert-danger">
                            <span className="alert-icon-sm"><AlertTriangle size={16} /></span>
                            <div>
                                <strong>Counterfeit Risk — Nagpur</strong>
                                <p>55% risk probability detected. Multiple failed scratch code attempts logged.</p>
                            </div>
                        </div>
                        <div className="alert-card alert-success">
                            <span className="alert-icon-sm"><CheckCircle2 size={16} /></span>
                            <div>
                                <strong>Inspector Approval Rate</strong>
                                <p>98% of batches passed inspection this week across all regions</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
