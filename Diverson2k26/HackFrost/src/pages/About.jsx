import React from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldCheck, Lock, Bot, AlertTriangle, Globe,
    CheckCircle2, Factory, ArrowRight, User, Zap, Heart
} from 'lucide-react';
import '../pages/Landing.css';

const STATS = [
    { icon: <CheckCircle2 size={24} strokeWidth={1.5} />, value: 'Thousands', label: 'of medicines verified daily — keeping families safe', color: '#F59E0B' },
    { icon: <ShieldCheck size={24} strokeWidth={1.5} />, value: '98%', label: 'accuracy in detecting counterfeit drugs', color: '#3B82F6' },
    { icon: <Factory size={24} strokeWidth={1.5} />, value: '500+', label: 'verified manufacturers trust our platform', color: '#8B5CF6' },
    { icon: <Globe size={24} strokeWidth={1.5} />, value: '12 States', label: 'covered with real-time counterfeit monitoring', color: '#c4923a' },
];

export default function About() {
    return (
        <div className="landing">
            {/* ═══ Page Header ═══ */}
            <section className="page-hero">
                <div className="page-hero-overlay"></div>
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div className="section-eyebrow">About PharmaChain</div>
                    <h1 className="section-title" style={{ fontSize: '2.6rem' }}>
                        Why You Should<br /><span className="gradient-text">Trust PharmaChain</span>
                    </h1>
                    <p className="section-subtitle" style={{ maxWidth: 600, margin: '0 auto 16px' }}>
                        Counterfeit medicines kill over 1 million people every year. We're on a mission to change that — using blockchain, AI, and community vigilance.
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
                        <Link to="/features" className="btn btn-primary btn-hero"><Zap size={18} /> See Our Features</Link>
                        <Link to="/verify" className="btn btn-secondary btn-hero"><ShieldCheck size={18} /> Verify Now</Link>
                    </div>
                </div>
            </section>

            {/* ═══ Stats ═══ */}
            <section className="stats-section">
                <div className="stats-grid-new">
                    {STATS.map((s, i) => (
                        <div key={i} className="stat-card-new animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                            <div className="stat-icon-new" style={{ color: s.color, background: `${s.color}15` }}>
                                {s.icon}
                            </div>
                            <div className="stat-content-new">
                                <span className="stat-value-new" style={{ color: s.color }}>{s.value}</span>
                                <span className="stat-label-new">{s.label}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Trust & Safety ═══ */}
            <section className="trust-section">
                <div className="trust-content">
                    <div className="section-eyebrow">Trust & Safety</div>
                    <h2 className="section-title">How We <span className="gradient-text">Keep You Safe</span></h2>
                    <div className="trust-grid">
                        <div className="trust-item animate-fade-up">
                            <div className="trust-item-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                                <Lock size={22} />
                            </div>
                            <div>
                                <h4>Immutable Records</h4>
                                <p>Once a batch is registered on blockchain, it cannot be altered or deleted. Ever. Every step in the supply chain is permanently recorded.</p>
                            </div>
                        </div>
                        <div className="trust-item animate-fade-up" style={{ animationDelay: '0.1s' }}>
                            <div className="trust-item-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                                <Bot size={22} />
                            </div>
                            <div>
                                <h4>AI-Powered Analysis</h4>
                                <p>Our risk engine analyzes 5 data sources simultaneously for every verification — scan patterns, supply chain gaps, timing anomalies, and more.</p>
                            </div>
                        </div>
                        <div className="trust-item animate-fade-up" style={{ animationDelay: '0.2s' }}>
                            <div className="trust-item-icon" style={{ background: 'rgba(196, 146, 58, 0.1)', color: '#c4923a' }}>
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <h4>Counterfeit Alerts</h4>
                                <p>Real-time alerts when flagged batches are detected in your region. Community-powered reporting means faster response to threats.</p>
                            </div>
                        </div>
                        <div className="trust-item animate-fade-up" style={{ animationDelay: '0.3s' }}>
                            <div className="trust-item-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                                <Globe size={22} />
                            </div>
                            <div>
                                <h4>Nationwide Coverage</h4>
                                <p>Monitoring active across 12 Indian states with thousands of daily verifications. Our network grows stronger every day.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ Mission Statement ═══ */}
            <section className="mission-section">
                <div className="mission-content">
                    <div className="section-eyebrow">Our Mission</div>
                    <h2 className="section-title"><span className="gradient-text">Saving Lives</span> Through Technology</h2>
                    <div className="mission-grid">
                        <div className="mission-card animate-fade-up">
                            <h3>The Problem</h3>
                            <p>Counterfeit medicines are a $200 billion global problem. In India alone, an estimated 25% of medicines sold are substandard or falsified. This isn't just a statistic — it's lives lost, families broken, and trust destroyed.</p>
                        </div>
                        <div className="mission-card animate-fade-up" style={{ animationDelay: '0.1s' }}>
                            <h3>Our Solution</h3>
                            <p>PharmaChain creates an unbreakable chain of trust from factory to patient. Every medicine gets a digital identity on the blockchain. Every transfer is tracked. Every verification is instant. No counterfeit can survive this level of scrutiny.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2 className="cta-title">Join the Fight Against Counterfeits.</h2>
                    <p className="cta-desc">Whether you're a customer protecting your family or a manufacturer building trust — PharmaChain is for you.</p>
                    <div className="cta-actions">
                        <Link to="/login/customer" className="btn btn-primary btn-hero"><User size={18} /> Create Account</Link>
                        <Link to="/features" className="btn btn-secondary btn-hero"><Zap size={18} /> Explore Features</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
