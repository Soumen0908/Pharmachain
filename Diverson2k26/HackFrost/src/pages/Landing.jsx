import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck, ArrowRight, User, Building2,
    Search, Zap, BarChart3, Heart, Pill, Activity, Truck
} from 'lucide-react';
import MedicineLookup from '../components/MedicineLookup';
import './Landing.css';

export default function Landing() {
    const { isAuthenticated } = useAuth();
    const [titleVisible, setTitleVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTitleVisible(true), 200);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="landing">
            {/* ═══ Hero ═══ */}
            <section className="hero">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>
                <div className="hero-grid-bg"></div>

                <div className="hero-content">
                    <div className="hero-badge animate-fade-in">
                        <span className="hero-badge-dot"></span>
                        Built on Ethereum · Powered by AI
                    </div>

                    <h1 className={`hero-title-new ${titleVisible ? 'visible' : ''}`}>
                        Trust Every Medicine<br />
                        <span className="hero-gradient-text">You Take.</span>
                    </h1>

                    <p className="hero-desc animate-fade-up stagger-2">
                        Don't gamble with your health. PharmaChain uses blockchain immutability and AI-driven analysis
                        to verify every medicine — so you know it's safe before you consume it.
                    </p>

                    <div className="hero-search-wrapper animate-fade-up stagger-3">
                        <MedicineLookup />
                    </div>

                    <div className="hero-actions animate-fade-up stagger-4">
                        <Link to="/verify" className="btn btn-primary btn-hero">
                            <ShieldCheck size={18} /> Verify a Medicine
                        </Link>
                        <Link to="/scan" className="btn btn-secondary btn-hero">
                            <Search size={18} /> Scan QR Code
                        </Link>
                    </div>
                </div>
            </section>

            {/* ═══ Role Selection (if not logged in) ═══ */}
            {!isAuthenticated && (
                <section className="role-section">
                    <div className="section-eyebrow">Get Started</div>
                    <h2 className="section-title">Join <span className="gradient-text">PharmaChain</span></h2>
                    <p className="section-subtitle">Choose how you want to use PharmaChain</p>
                    <div className="role-cards">
                        <Link to="/login/customer" className="role-select-card role-customer">
                            <div className="role-select-icon"><User size={32} /></div>
                            <h3>I'm a Customer</h3>
                            <p>Verify medicines, save prescriptions, get expiry alerts, and protect your family</p>
                            <span className="role-select-cta">Create Free Account <ArrowRight size={16} /></span>
                        </Link>
                        <Link to="/login/manufacturer" className="role-select-card role-manufacturer">
                            <div className="role-select-icon"><Building2 size={32} /></div>
                            <h3>I'm a Manufacturer</h3>
                            <p>Register batches, earn verification badge, build consumer trust with govt ID proof</p>
                            <span className="role-select-cta">Get Verified <ArrowRight size={16} /></span>
                        </Link>
                    </div>
                </section>
            )}

            {/* ═══ Quick Navigation Cards ═══ */}
            <section className="nav-cards-section">
                <div className="section-eyebrow">Explore</div>
                <h2 className="section-title">Discover What <span className="gradient-text">PharmaChain Offers</span></h2>
                <div className="nav-cards-grid">
                    <Link to="/features" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(90, 154, 122, 0.1)', color: '#5a9a7a' }}>
                            <Zap size={28} />
                        </div>
                        <h3>Features</h3>
                        <p>Explore our blockchain verification, AI risk detection, supply chain tracking, and more</p>
                        <span className="nav-card-cta">View All Features <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/about" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(90, 138, 170, 0.1)', color: '#5a8aaa' }}>
                            <Heart size={28} />
                        </div>
                        <h3>About & Trust</h3>
                        <p>Learn why thousands of users trust PharmaChain and how we keep your medicines safe</p>
                        <span className="nav-card-cta">Learn More <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/analytics" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(138, 122, 184, 0.1)', color: '#8a7ab8' }}>
                            <BarChart3 size={28} />
                        </div>
                        <h3>Analytics</h3>
                        <p>View counterfeit heatmaps, supply chain flow data, and regional risk dashboards</p>
                        <span className="nav-card-cta">View Analytics <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/medicine-search" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(90, 170, 138, 0.1)', color: '#4ab88a' }}>
                            <Pill size={28} />
                        </div>
                        <h3>Medicine Search</h3>
                        <p>Search any medicine using AI to get full details — composition, uses, side effects, pricing</p>
                        <span className="nav-card-cta">Search Medicines <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/batch-tracker" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(184, 138, 90, 0.1)', color: '#b88a4a' }}>
                            <Activity size={28} />
                        </div>
                        <h3>Batch Tracker</h3>
                        <p>Monitor real-time batch registrations, transfers, and approvals as they happen live</p>
                        <span className="nav-card-cta">Track Batches <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/supply-chain" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(90, 122, 184, 0.1)', color: '#5a7ab8' }}>
                            <Truck size={28} />
                        </div>
                        <h3>Supply Chain</h3>
                        <p>Visualize the end-to-end supply chain pipeline from manufacturer to retailer</p>
                        <span className="nav-card-cta">View Pipeline <ArrowRight size={14} /></span>
                    </Link>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section className="cta-section">
                <div className="cta-content">
                    <h2 className="cta-title">Your Health Deserves Certainty.</h2>
                    <p className="cta-desc">Every scan you make protects someone from a counterfeit drug. Start verifying today.</p>
                    <div className="cta-actions">
                        <Link to="/verify" className="btn btn-primary btn-hero"><ShieldCheck size={18} /> Verify a Medicine</Link>
                        {!isAuthenticated && (
                            <Link to="/login/customer" className="btn btn-secondary btn-hero"><User size={18} /> Create Account</Link>
                        )}
                    </div>
                </div>
            </section>

            {/* ═══ Footer ═══ */}
            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-brand">
                        <span className="gradient-text" style={{ fontSize: '1.1rem', fontWeight: 800 }}>PharmaChain</span>
                        <p>Trust every medicine you take. Blockchain-powered pharmaceutical verification for India.</p>
                    </div>
                    <div className="footer-links">
                        <Link to="/verify">Verify</Link>
                        <Link to="/features">Features</Link>
                        <Link to="/about">About</Link>
                        <Link to="/analytics">Analytics</Link>
                        <Link to="/scan">Scan</Link>
                        <Link to="/medicine-search">Medicine Search</Link>
                        <Link to="/batch-tracker">Batch Tracker</Link>
                        <Link to="/supply-chain">Supply Chain</Link>
                        <Link to="/login/customer">Customer Login</Link>
                        <Link to="/login/manufacturer">Manufacturer Login</Link>
                    </div>
                </div>
                <div className="footer-copy">© 2026 PharmaChain. Built for HackFrost. Your health, our mission.</div>
            </footer>
        </div>
    );
}
