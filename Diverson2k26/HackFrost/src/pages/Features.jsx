import React from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldCheck, Bot, Thermometer, Ticket, BarChart3, Trophy,
    Search, ArrowRight, ChevronRight, Heart, Zap
} from 'lucide-react';
import '../pages/Landing.css';

const FEATURES = [
    { icon: <ShieldCheck size={28} strokeWidth={1.5} />, title: 'Blockchain Verification', desc: 'Every medicine batch is recorded immutably on Ethereum. No tampering, no forgery — full transparency for your safety.', size: 'large' },
    { icon: <Bot size={28} strokeWidth={1.5} />, title: 'AI Risk Detection', desc: 'Machine learning detects anomalies in real-time — suspicious patterns, supply chain breaks, and counterfeit signals.', size: 'large' },
    { icon: <Thermometer size={22} strokeWidth={1.5} />, title: 'Cold Chain Monitoring', desc: 'Live temperature tracking for vaccines via IoT sensors with automatic excursion alerts.' },
    { icon: <Ticket size={22} strokeWidth={1.5} />, title: 'Scratch & Verify', desc: 'Physical scratch codes on packaging connect to blockchain records. First activation = proof of authenticity.' },
    { icon: <BarChart3 size={22} strokeWidth={1.5} />, title: 'Counterfeit Heatmaps', desc: 'Regional risk scoring, supply flow visualization, and inspector dashboards for enterprise intelligence.' },
    { icon: <Trophy size={22} strokeWidth={1.5} />, title: 'Gamified Reporting', desc: 'Earn points and badges by verifying products and reporting counterfeits. Your vigilance saves lives.' },
];

const HOW_IT_WORKS = [
    { num: '01', title: 'Search or Scan', desc: 'Type the medicine name, batch number, or scan the QR code on the packaging', icon: <Search size={24} /> },
    { num: '02', title: 'Instant Verification', desc: 'Our AI and blockchain check authenticity, batch validity, and supply chain integrity', icon: <ShieldCheck size={24} /> },
    { num: '03', title: 'Trust & Act', desc: 'Get a clear safety score, source timeline, and confidence breakdown — know before you consume', icon: <Heart size={24} /> },
];

export default function Features() {
    return (
        <div className="landing">
            {/* ═══ Page Header ═══ */}
            <section className="page-hero">
                <div className="page-hero-overlay"></div>
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="section-eyebrow">Platform</div>
                    <h1 className="section-title" style={{ fontSize: '2.6rem' }}>
                        Everything You Need to<br /><span className="gradient-text">Fight Counterfeits</span>
                    </h1>
                    <p className="section-subtitle" style={{ maxWidth: 600, margin: '0 auto 16px' }}>
                        PharmaChain combines blockchain, AI, and IoT technologies to create the most comprehensive anti-counterfeit platform for pharmaceuticals.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                        <Link to="/verify" className="btn btn-primary btn-hero"><ShieldCheck size={18} /> Try Verification</Link>
                        <Link to="/about" className="btn btn-secondary btn-hero"><Heart size={18} /> Why Trust Us</Link>
                    </div>
                </div>
            </section>

            {/* ═══ Features Grid ═══ */}
            <section className="features-section">
                <div className="features-grid-new">
                    {FEATURES.map((f, i) => (
                        <div key={i} className={`feature-card-new premium-card animate-fade-up ${f.size === 'large' ? 'feature-large' : ''}`} style={{ animationDelay: `${i * 0.08}s` }}>
                            <div className="feature-icon-new">{f.icon}</div>
                            <h3 className="feature-title">{f.title}</h3>
                            <p className="feature-desc">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ How It Works ═══ */}
            <section className="process-section">
                <div className="section-eyebrow">How It Works</div>
                <h2 className="section-title">Three Steps to <span className="gradient-text">Peace of Mind</span></h2>
                <div className="process-grid-new">
                    {HOW_IT_WORKS.map((step, i) => (
                        <div key={i} className="step-card-new animate-fade-up" style={{ animationDelay: `${i * 0.12}s` }}>
                            <div className="step-num-new">{step.num}</div>
                            <div className="step-icon-new">{step.icon}</div>
                            <h4 className="step-title-new">{step.title}</h4>
                            <p className="step-desc-new">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Navigation to Other Pages ═══ */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2 className="cta-title">Ready to Verify?</h2>
                    <p className="cta-desc">Start protecting yourself and your family from counterfeit medicines today.</p>
                    <div className="cta-actions">
                        <Link to="/verify" className="btn btn-primary btn-hero"><ShieldCheck size={18} /> Verify a Medicine</Link>
                        <Link to="/about" className="btn btn-secondary btn-hero"><Heart size={18} /> Learn About Trust</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
