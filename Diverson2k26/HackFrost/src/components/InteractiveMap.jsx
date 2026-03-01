import React, { useState } from 'react';

// India city coordinates mapped to a 400x450 SVG viewBox
const CITY_POSITIONS = {
    'Mumbai': { x: 130, y: 300 },
    'Delhi': { x: 185, y: 130 },
    'Bangalore': { x: 170, y: 380 },
    'Hyderabad': { x: 185, y: 330 },
    'Chennai': { x: 210, y: 375 },
    'Kolkata': { x: 290, y: 230 },
    'Pune': { x: 145, y: 310 },
    'Ahmedabad': { x: 120, y: 220 },
    'Nagpur': { x: 195, y: 260 },
    'Jaipur': { x: 165, y: 175 },
};

export default function InteractiveMap({ heatmapData }) {
    const [hover, setHover] = useState(null);

    const getRiskColor = (risk) => {
        if (risk > 40) return '#ef4444';
        if (risk > 20) return '#f59e0b';
        return '#00d4aa';
    };

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <svg viewBox="0 0 400 450" style={{ width: '100%', height: 'auto' }}>
                {/* India outline (simplified) */}
                <path d="M160,60 L200,50 L230,60 L260,55 L280,70 L310,80 L320,110 L315,140 L305,170 L310,200 L300,220 L305,250 L290,260 L270,240 L260,260 L240,280 L250,310 L240,340 L230,360 L220,380 L200,400 L185,410 L170,400 L160,380 L150,360 L130,340 L120,310 L105,280 L100,250 L90,220 L95,190 L110,170 L120,150 L130,130 L140,100 L150,80 Z"
                    fill="rgba(0, 212, 170, 0.05)"
                    stroke="rgba(0, 212, 170, 0.2)"
                    strokeWidth="1.5"
                />

                {/* City markers */}
                {heatmapData.map((region, i) => {
                    const pos = CITY_POSITIONS[region.name];
                    if (!pos) return null;
                    const color = getRiskColor(region.risk);
                    const r = 8 + (region.risk / 55) * 16;

                    return (
                        <g key={i}
                            onMouseEnter={() => setHover(region)}
                            onMouseLeave={() => setHover(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            {/* Pulse ring */}
                            <circle cx={pos.x} cy={pos.y} r={r + 6} fill="none" stroke={color} strokeWidth="1" opacity="0.3">
                                <animate attributeName="r" from={r} to={r + 14} dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                            </circle>
                            {/* Risk circle */}
                            <circle cx={pos.x} cy={pos.y} r={r} fill={color} opacity="0.25" stroke={color} strokeWidth="1.5" />
                            {/* Center dot */}
                            <circle cx={pos.x} cy={pos.y} r="3" fill={color} />
                            {/* Label */}
                            <text x={pos.x} y={pos.y - r - 6} textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600" fontFamily="Inter, sans-serif">
                                {region.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Tooltip */}
            {hover && (
                <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'var(--bg-card)', backdropFilter: 'blur(12px)',
                    border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                    padding: '12px 16px', minWidth: '180px',
                    boxShadow: 'var(--shadow-md)', zIndex: 10,
                }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-bright)' }}>
                        📍 {hover.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Risk Level</span>
                            <span style={{ color: getRiskColor(hover.risk), fontWeight: 700 }}>{hover.risk}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Total Scans</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{hover.scans}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Suspicious</span>
                            <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{hover.suspicious}</span>
                        </div>
                        <div style={{
                            marginTop: '6px', height: '4px', borderRadius: '2px',
                            background: 'rgba(255,255,255,0.05)', overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${hover.risk}%`, height: '100%',
                                background: getRiskColor(hover.risk), borderRadius: '2px',
                                transition: 'width 0.3s ease'
                            }} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
