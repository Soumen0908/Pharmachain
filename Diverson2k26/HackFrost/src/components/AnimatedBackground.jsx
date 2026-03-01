import React, { useEffect, useRef, useCallback } from 'react';
import Galaxy from './Galaxy';
import './AnimatedBackground.css';

/*
 * AnimatedBackground — Galaxy starfield + floating pharma images, SVG icons & orbs
 * Mouse-tracking parallax, hover glow effects, click pulse animations
 */
export default function AnimatedBackground() {
    const containerRef = useRef(null);
    const mouseRef = useRef({ x: 0.5, y: 0.5 });
    const rafRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        mouseRef.current = {
            x: e.clientX / window.innerWidth,
            y: e.clientY / window.innerHeight
        };

        if (!rafRef.current) {
            rafRef.current = requestAnimationFrame(() => {
                const container = containerRef.current;
                if (!container) { rafRef.current = null; return; }

                const { x, y } = mouseRef.current;
                // Parallax offset — images move opposite to mouse for depth
                const imgs = container.querySelectorAll('.bg-img');
                imgs.forEach((img, i) => {
                    const depth = (i + 1) * 12; // Different depth per image
                    const offsetX = (0.5 - x) * depth;
                    const offsetY = (0.5 - y) * depth;
                    img.style.setProperty('--px', `${offsetX}px`);
                    img.style.setProperty('--py', `${offsetY}px`);
                });

                // SVG icons get lighter parallax
                const icons = container.querySelectorAll('.bg-icon');
                icons.forEach((icon, i) => {
                    const depth = (i + 1) * 5;
                    const offsetX = (0.5 - x) * depth;
                    const offsetY = (0.5 - y) * depth;
                    icon.style.setProperty('--px', `${offsetX}px`);
                    icon.style.setProperty('--py', `${offsetY}px`);
                });

                rafRef.current = null;
            });
        }
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [handleMouseMove]);

    const handleImgClick = (e) => {
        const el = e.currentTarget;
        el.classList.remove('bg-img-pulse');
        // Force reflow
        void el.offsetWidth;
        el.classList.add('bg-img-pulse');
    };

    return (
        <div className="animated-bg" ref={containerRef} aria-hidden="true">
            {/* ── Galaxy starfield canvas ── */}
            <div className="galaxy-layer">
                <Galaxy
                    mouseRepulsion
                    mouseInteraction
                    density={1}
                    glowIntensity={0.3}
                    saturation={0}
                    hueShift={200}
                    twinkleIntensity={0.3}
                    rotationSpeed={0.08}
                    repulsionStrength={2}
                    autoCenterRepulsion={0}
                    starSpeed={0.3}
                    speed={1}
                />
            </div>
            {/* ── Background Images — interactive ── */}
            <img
                src="/bg-pills.png"
                alt=""
                className="bg-img bg-img-1"
                onClick={handleImgClick}
            />
            <img
                src="/bg-molecule.png"
                alt=""
                className="bg-img bg-img-2"
                onClick={handleImgClick}
            />
            <img
                src="/bg-dna.png"
                alt=""
                className="bg-img bg-img-3"
                onClick={handleImgClick}
            />

            {/* ── Floating pharma SVG icons ── */}

            {/* 1 — Pill capsule */}
            <svg className="bg-icon bg-icon-1" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.5 1.5H8A6.5 6.5 0 0 0 1.5 8v0A6.5 6.5 0 0 0 8 14.5h0a6.5 6.5 0 0 0 6.5-6.5V6.5" />
                <path d="m10.5 1.5 4 4" />
                <rect x="4.5" y="11" width="15" height="8" rx="4" ry="4" transform="rotate(-45 12 15)" />
            </svg>

            {/* 2 — Shield check */}
            <svg className="bg-icon bg-icon-2" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
            </svg>

            {/* 3 — Molecule */}
            <svg className="bg-icon bg-icon-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="4" r="1.5" />
                <circle cx="18.5" cy="16" r="1.5" />
                <circle cx="5.5" cy="16" r="1.5" />
                <line x1="12" y1="6" x2="12" y2="10" />
                <line x1="13.7" y1="13" x2="17" y2="15" />
                <line x1="10.3" y1="13" x2="7" y2="15" />
            </svg>

            {/* 4 — DNA helix */}
            <svg className="bg-icon bg-icon-4" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 15c6.667-6 13.333 0 20-6" />
                <path d="M9 22c1.798-1.998 2.518-3.995 2.807-5.993" />
                <path d="M15 2c-1.798 1.998-2.518 3.995-2.807 5.993" />
                <path d="M2 9c6.667 6 13.333 0 20 6" />
            </svg>

            {/* 5 — Syringe */}
            <svg className="bg-icon bg-icon-5" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 2 4 4" />
                <path d="m17 7 3-3" />
                <path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0L3.7 17.7c-1-1-1-2.5 0-3.4L14 4" />
                <path d="m9 11 4 4" />
                <path d="m5 19-3 3" />
                <path d="m14 4 6 6" />
            </svg>

            {/* 6 — Thermometer */}
            <svg className="bg-icon bg-icon-6" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
            </svg>

            {/* 7 — Heart pulse */}
            <svg className="bg-icon bg-icon-7" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19.5 12.572l-7.5 7.428-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572" />
                <path d="M5 12h2l2-3 3 6 2-3h5" />
            </svg>

            {/* 8 — Package */}
            <svg className="bg-icon bg-icon-8" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16.5 9.4 7.55 4.24" />
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.29 7 12 12 20.71 7" />
                <line x1="12" y1="22" x2="12" y2="12" />
            </svg>

            {/* ── Glowing orbs ── */}
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="bg-orb bg-orb-3" />
            <div className="bg-orb bg-orb-4" />
            <div className="bg-orb bg-orb-5" />
        </div>
    );
}
