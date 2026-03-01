import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';

const WORDS = ['Verified', 'Traceable', 'Immutable', 'Trusted'];

export default function Intro() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState(0);
    const [wordIdx, setWordIdx] = useState(0);
    const progressRef = useRef(null);

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 600),
            setTimeout(() => setPhase(2), 1600),
            setTimeout(() => setPhase(3), 2600),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setWordIdx(prev => (prev + 1) % WORDS.length);
        }, 2200);
        return () => clearInterval(interval);
    }, []);

    function enterApp() {
        const el = document.querySelector('.intro-page');
        if (el) el.classList.add('intro-exit');
        setTimeout(() => navigate('/home'), 600);
    }

    return (
        <div className="intro-page">
            {/* Cinematic background overlay */}
            <div className="intro-bg">
                <div className="intro-noise"></div>
                <div className="intro-vignette"></div>
                <div className="intro-gradient-sweep"></div>
            </div>

            {/* Thin scan line */}
            <div className="intro-scanline"></div>

            <div className="intro-content">
                {/* Top bar */}
                <div className={`intro-topbar ${phase >= 0 ? 'visible' : ''}`}>
                    <span className="intro-label">PHARMACHAIN</span>
                    <span className="intro-label-dot"></span>
                    <span className="intro-label-sub">Anti-Counterfeit Infrastructure</span>
                </div>

                {/* Hero headline */}
                <div className={`intro-headline ${phase >= 1 ? 'visible' : ''}`}>
                    <h1>
                        Every medicine<br />
                        should be{' '}
                        <span className="intro-rotating-word" key={wordIdx}>
                            {WORDS[wordIdx]}
                        </span>
                    </h1>
                </div>

                {/* Stats row */}
                <div className={`intro-stats ${phase >= 2 ? 'visible' : ''}`}>
                    <div className="intro-stat">
                        <span className="intro-stat-num">1M+</span>
                        <span className="intro-stat-label">Lives lost yearly to counterfeits</span>
                    </div>
                    <div className="intro-stat-sep"></div>
                    <div className="intro-stat">
                        <span className="intro-stat-num">$200B</span>
                        <span className="intro-stat-label">Global counterfeit drug market</span>
                    </div>
                    <div className="intro-stat-sep"></div>
                    <div className="intro-stat">
                        <span className="intro-stat-num">30%</span>
                        <span className="intro-stat-label">Of drugs in developing nations are fake</span>
                    </div>
                </div>

                {/* CTA */}
                <div className={`intro-cta ${phase >= 3 ? 'visible' : ''}`}>
                    <button className="intro-enter-btn" onClick={enterApp}>
                        <span>Enter Platform</span>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Footer line */}
                <div className={`intro-footer ${phase >= 3 ? 'visible' : ''}`}>
                    <span>Blockchain</span>
                    <span className="intro-footer-dot">·</span>
                    <span>AI Detection</span>
                    <span className="intro-footer-dot">·</span>
                    <span>Supply Chain</span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="intro-progress" ref={progressRef}>
                <div className="intro-progress-fill"></div>
            </div>
        </div>
    );
}
