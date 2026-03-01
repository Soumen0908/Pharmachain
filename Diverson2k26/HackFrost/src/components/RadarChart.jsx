import React, { useEffect, useRef } from 'react';

const AXIS_COLORS = ['#00d4aa', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function RadarChart({ breakdown, size = 240 }) {
    const canvasRef = useRef(null);
    const animRef = useRef(0);

    const labels = Object.values(breakdown).map(b => b.label.replace('Supply Chain ', 'Supply\nChain '));
    const scores = Object.values(breakdown).map(b => b.score / 100);
    const n = labels.length;
    const cx = size / 2;
    const cy = size / 2;
    const R = size * 0.36;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        canvas.width = size * dpr;
        canvas.height = size * dpr;
        ctx.scale(dpr, dpr);

        let progress = 0;
        const duration = 60; // frames

        function getPoint(i, r) {
            const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
            return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
        }

        function draw() {
            progress = Math.min(progress + 1, duration);
            const t = easeOut(progress / duration);
            ctx.clearRect(0, 0, size, size);

            // Grid rings
            for (let ring = 1; ring <= 4; ring++) {
                const r = (R * ring) / 4;
                ctx.beginPath();
                for (let i = 0; i <= n; i++) {
                    const p = getPoint(i % n, r);
                    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
                }
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Axis lines
            for (let i = 0; i < n; i++) {
                const p = getPoint(i, R);
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(p.x, p.y);
                ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Data polygon
            ctx.beginPath();
            for (let i = 0; i <= n; i++) {
                const idx = i % n;
                const r = R * scores[idx] * t;
                const p = getPoint(idx, r);
                i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
            }
            ctx.fillStyle = 'rgba(0, 212, 170, 0.15)';
            ctx.fill();
            ctx.strokeStyle = '#00d4aa';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Data points
            for (let i = 0; i < n; i++) {
                const r = R * scores[i] * t;
                const p = getPoint(i, r);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = AXIS_COLORS[i];
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }

            // Labels
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            for (let i = 0; i < n; i++) {
                const p = getPoint(i, R + 28);
                ctx.fillStyle = AXIS_COLORS[i];
                const lines = labels[i].split('\n');
                lines.forEach((line, li) => {
                    ctx.fillText(line, p.x, p.y + (li - (lines.length - 1) / 2) * 12);
                });
            }

            if (progress < duration) {
                animRef.current = requestAnimationFrame(draw);
            }
        }

        draw();
        return () => cancelAnimationFrame(animRef.current);
    }, [breakdown, size]);

    function easeOut(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <canvas
                ref={canvasRef}
                style={{ width: size, height: size }}
            />
        </div>
    );
}
