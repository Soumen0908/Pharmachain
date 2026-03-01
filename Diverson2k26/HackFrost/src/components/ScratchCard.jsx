import React, { useEffect, useState } from 'react';
import { PartyPopper, AlertTriangle, Trophy } from 'lucide-react';
import './ScratchCard.css';

export default function ScratchCard({ isFirstActivation, reward, onComplete }) {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        // Auto-reveal after a brief delay
        const timer = setTimeout(() => {
            setRevealed(true);
            onComplete?.();
        }, 600);
        return () => clearTimeout(timer);
    }, [onComplete]);

    return (
        <div className={`scratch-card-wrapper ${revealed ? 'revealed' : ''}`}>
            <div className="scratch-card-result" style={{
                background: isFirstActivation
                    ? 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(0,212,170,0.15))'
                    : 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))'
            }}>
                {isFirstActivation ? (
                    <>
                        <div className="scratch-result-icon"><PartyPopper size={36} /></div>
                        <div className="scratch-result-title" style={{ color: 'var(--success)' }}>
                            Authentic! Ownership Transferred
                        </div>
                        {reward && (
                            <div className="scratch-reward-badge">
                                +{reward.points} Points Earned! <Trophy size={16} style={{ verticalAlign: 'middle' }} />
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="scratch-result-icon"><AlertTriangle size={36} /></div>
                        <div className="scratch-result-title" style={{ color: 'var(--danger)' }}>
                            Duplicate Activation Detected
                        </div>
                        <div className="scratch-warning-text">
                            This may indicate a counterfeit product
                        </div>
                    </>
                )}
            </div>
            {revealed && isFirstActivation && <Confetti />}
        </div>
    );
}

function Confetti() {
    const particles = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 0.5}s`,
        color: ['#00d4aa', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'][i % 5],
        size: 4 + Math.random() * 6,
        duration: `${0.8 + Math.random() * 1.2}s`,
    }));

    return (
        <div className="confetti-container">
            {particles.map(p => (
                <div key={p.id} className="confetti-particle" style={{
                    left: p.left,
                    animationDelay: p.delay,
                    animationDuration: p.duration,
                    background: p.color,
                    width: p.size,
                    height: p.size,
                }} />
            ))}
        </div>
    );
}
