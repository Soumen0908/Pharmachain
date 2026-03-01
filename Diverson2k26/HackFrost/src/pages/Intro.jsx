import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Intro.css';

export default function Intro() {
    const navigate = useNavigate();
    const [phase, setPhase] = useState(0); // 0=logo, 1=tagline, 2=stats, 3=cta

    useEffect(() => {
        const timers = [
            setTimeout(() => setPhase(1), 800),
            setTimeout(() => setPhase(2), 2000),
            setTimeout(() => setPhase(3), 3200),
        ];
        return () => timers.forEach(clearTimeout);
    }, []);

    function enterApp() {
        const el = document.querySelector('.intro-page');
        if (el) el.classList.add('intro-exit');
        setTimeout(() => navigate('/home'), 600);
    }

    return (
        <div className="intro-page">
            {/* Ambient background */}
            <div className="intro-bg">
                <div className="intro-orb intro-orb-1"></div>
                <div className="intro-orb intro-orb-2"></div>
                <div className="intro-orb intro-orb-3"></div>
                <div className="intro-grid"></div>
            </div>

            {/* Floating particles */}
            <div className="intro-particles">
                {[...Array(20)].map((_, i) => (
                    <div key={i} className="intro-particle" style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 5}s`,
                        animationDuration: `${4 + Math.random() * 6}s`,
                        width: `${2 + Math.random() * 4}px`,
                        height: `${2 + Math.random() * 4}px`,
                    }}></div>
                ))}
            </div>

            <div className="intro-content">
                {/* Phase 0: Logo */}
                <div className={`intro-logo-block ${phase >= 0 ? 'visible' : ''}`}>
                    <div className="intro-logo">
                        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="72" height="72" rx="18" fill="url(#logoGrad)" />
                            <path d="M36 16L24 28v12l12 12 12-12V28L36 16z" fill="white" opacity="0.9" />
                            <circle cx="36" cy="34" r="6" fill="white" />
                            <path d="M36 40v8" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            <path d="M30 44h12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                            <defs>
                                <linearGradient id="logoGrad" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#5a9a7a" />
                                    <stop offset="1" stopColor="#4a8a9a" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h1 className="intro-brand">PharmaChain</h1>
                    <div className="intro-tagline-badge">Anti-Counterfeit Drug Infrastructure</div>
                </div>

                {/* Phase 1: Mission Statement */}
                <div className={`intro-mission ${phase >= 1 ? 'visible' : ''}`}>
                    <p className="intro-mission-text">
                        <span className="intro-highlight">1 million lives</span> are lost every year to counterfeit medicines.
                        <br />We're building the technology to make that number <span className="intro-highlight">zero</span>.
                    </p>
                </div>

                {/* Phase 2: Key pillars */}
                <div className={`intro-pillars ${phase >= 2 ? 'visible' : ''}`}>
                    <div className="intro-pillar">
                        <div className="intro-pillar-icon">⛓️</div>
                        <span>Blockchain Verified</span>
                    </div>
                    <div className="intro-pillar-divider"></div>
                    <div className="intro-pillar">
                        <div className="intro-pillar-icon">🤖</div>
                        <span>AI-Powered Detection</span>
                    </div>
                    <div className="intro-pillar-divider"></div>
                    <div className="intro-pillar">
                        <div className="intro-pillar-icon">🔬</div>
                        <span>End-to-End Traceability</span>
                    </div>
                </div>

                {/* Phase 3: CTA */}
                <div className={`intro-cta ${phase >= 3 ? 'visible' : ''}`}>
                    <button className="intro-enter-btn" onClick={enterApp}>
                        Enter PharmaChain
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </button>
                    <p className="intro-skip">Built on Ethereum · Powered by AI · Made in India 🇮🇳</p>
                </div>
            </div>

            {/* Bottom gradient line */}
            <div className="intro-bottom-line"></div>
        </div>
    );
}
