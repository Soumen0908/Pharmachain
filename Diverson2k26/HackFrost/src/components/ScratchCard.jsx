import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PartyPopper, AlertTriangle, Trophy } from 'lucide-react';
import './ScratchCard.css';

export default function ScratchCard({ isFirstActivation, reward, onComplete }) {
    const canvasRef = useRef(null);
    const [revealed, setRevealed] = useState(false);
    const [scratching, setScratching] = useState(false);
    const scratchedRef = useRef(0);

    const W = 320;
    const H = 200;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        ctx.scale(dpr, dpr);

        // Draw the scratchable cover
        const gradient = ctx.createLinearGradient(0, 0, W, H);
        gradient.addColorStop(0, '#1a1e3a');
        gradient.addColorStop(0.5, '#0f2340');
        gradient.addColorStop(1, '#1a1e3a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, W, H);

        // Add shimmer pattern
        ctx.fillStyle = 'rgba(0, 212, 170, 0.08)';
        for (let i = 0; i < 20; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * W, Math.random() * H, Math.random() * 30 + 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Text
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '600 16px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Scratch to Reveal Result', W / 2, H / 2 - 10);
        ctx.font = '12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillText('Use your mouse or finger to scratch', W / 2, H / 2 + 15);
    }, []);

    const scratch = useCallback((x, y) => {
        const canvas = canvasRef.current;
        if (!canvas || revealed) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x * dpr, y * dpr, 20 * dpr, 0, Math.PI * 2);
        ctx.fill();

        scratchedRef.current += 1;
        if (scratchedRef.current > 40 && !revealed) {
            setRevealed(true);
            onComplete?.();
        }
    }, [revealed, onComplete]);

    const getPos = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const handleStart = (e) => {
        e.preventDefault();
        setScratching(true);
        const pos = getPos(e);
        scratch(pos.x, pos.y);
    };

    const handleMove = (e) => {
        if (!scratching) return;
        e.preventDefault();
        const pos = getPos(e);
        scratch(pos.x, pos.y);
    };

    const handleEnd = () => setScratching(false);

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
            <canvas
                ref={canvasRef}
                className={`scratch-canvas ${revealed ? 'fade-out' : ''}`}
                style={{ width: W, height: H }}
                onMouseDown={handleStart}
                onMouseMove={handleMove}
                onMouseUp={handleEnd}
                onMouseLeave={handleEnd}
                onTouchStart={handleStart}
                onTouchMove={handleMove}
                onTouchEnd={handleEnd}
            />
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
