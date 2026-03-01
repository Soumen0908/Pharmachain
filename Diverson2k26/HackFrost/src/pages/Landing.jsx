import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    ShieldCheck, ArrowRight, User, Building2,
    Search, Zap, BarChart3, Heart, Pill, Activity, Truck,
    QrCode, LayoutDashboard
} from 'lucide-react';
import MedicineLookup from '../components/MedicineLookup';
import './Landing.css';

export default function Landing() {
    const { isAuthenticated, user } = useAuth();
    const [titleVisible, setTitleVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setTitleVisible(true), 200);
        return () => clearTimeout(timer);
    }, []);

    const userRole = user?.role; // 'manufacturer' | 'customer' | undefined

    // Build quick-access links based on role
    const quickLinks = useMemo(() => {
        if (userRole === 'manufacturer') {
            return [
                { to: '/manufacturer', label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
                { to: '/verify', label: 'Verify Medicine', icon: <ShieldCheck size={18} /> },
                { to: '/features', label: 'All Features', icon: <Zap size={18} /> },
                { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
            ];
        }
        if (userRole === 'customer') {
            return [
                { to: '/customer-dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={18} /> },
                { to: '/scan', label: 'Scan QR Code', icon: <QrCode size={18} /> },
                { to: '/batch-tracker', label: 'Batch Tracker', icon: <Activity size={18} /> },
                { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
            ];
        }
        // Not logged in
        return [
            { to: '/login/customer', label: 'Sign In / Sign Up', icon: <User size={18} /> },
            { to: '/verify', label: 'Verify Medicine', icon: <ShieldCheck size={18} /> },
            { to: '/features', label: 'All Features', icon: <Zap size={18} /> },
            { to: '/analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
        ];
    }, [userRole]);

    return (
        <div className="landing">
            {/* ═══ Hero ═══ */}
            <section className="hero">
                <div className="hero-orb hero-orb-1"></div>
                <div className="hero-orb hero-orb-2"></div>
                <div className="hero-orb hero-orb-3"></div>
                <div className="hero-grid-bg"></div>

                <div className="hero-content">
                    {/* Left + Right layout */}
                    <div className="hero-split">
                        <div className="hero-left">
                            <div className="hero-badge animate-fade-in">
                                <span className="hero-badge-dot"></span>
                                Built on Ethereum · Blockchain Verified
                            </div>

                            <h1 className={`hero-title-new ${titleVisible ? 'visible' : ''}`}>
                                Trust Every Medicine<br />
                                <span className="hero-gradient-text">You Take.</span>
                            </h1>

                            <p className="hero-desc animate-fade-up stagger-2">
                                PharmaChain uses blockchain immutability and multi-source analysis
                                to verify every medicine — from manufacturing floor to your hands.
                            </p>

                            <div className="hero-actions animate-fade-up stagger-3">
                                <Link to="/verify" className="btn btn-primary btn-hero">
                                    <ShieldCheck size={16} /> Verify a Medicine
                                </Link>
                                {userRole !== 'manufacturer' && (
                                    <Link to={isAuthenticated ? '/scan' : '/login/customer'} className="btn btn-secondary btn-hero">
                                        <QrCode size={16} /> Scan QR Code
                                    </Link>
                                )}
                            </div>

                            <div className="hero-stats animate-fade-up stagger-4">
                                <div className="hero-stat">
                                    <span className="hero-stat-value">On-Chain</span>
                                    <span className="hero-stat-label">IMMUTABLE RECORDS</span>
                                </div>
                                <div className="hero-stat-divider"></div>
                                <div className="hero-stat">
                                    <span className="hero-stat-value">Multi-Source</span>
                                    <span className="hero-stat-label">RISK ANALYSIS</span>
                                </div>
                                <div className="hero-stat-divider"></div>
                                <div className="hero-stat">
                                    <span className="hero-stat-value">24/7</span>
                                    <span className="hero-stat-label">VERIFICATION</span>
                                </div>
                            </div>
                        </div>

                        <div className="hero-right animate-fade-up stagger-3">
                            <div className="quick-access-panel">
                                <h3 className="quick-access-title">QUICK ACCESS</h3>
                                {quickLinks.map((link, i) => (
                                    <Link key={i} to={link.to} className="quick-access-link">
                                        <span className="quick-access-icon">{link.icon}</span>
                                        <span className="quick-access-label">{link.label}</span>
                                        <ArrowRight size={16} className="quick-access-arrow" />
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══ Medicine Lookup ═══ */}
            <section className="lookup-section">
                <div className="lookup-wrapper">
                    <MedicineLookup />
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
                            <h3>I'm a Customer / Retailer</h3>
                            <p>Scan QR codes, view batch history & details, verify medicines, and protect your family</p>
                            <span className="role-select-cta">Create Free Account <ArrowRight size={16} /></span>
                        </Link>
                        <Link to="/login/manufacturer" className="role-select-card role-manufacturer">
                            <div className="role-select-icon"><Building2 size={32} /></div>
                            <h3>I'm a Manufacturer</h3>
                            <p>Register batches, generate QR codes, verify medicines, and build consumer trust</p>
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
                        <div className="nav-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                            <Zap size={28} />
                        </div>
                        <h3>Features</h3>
                        <p>Explore our blockchain verification, AI risk detection, supply chain tracking, and more</p>
                        <span className="nav-card-cta">View All Features <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/about" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                            <Heart size={28} />
                        </div>
                        <h3>About & Trust</h3>
                        <p>Learn why thousands of users trust PharmaChain and how we keep your medicines safe</p>
                        <span className="nav-card-cta">Learn More <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/analytics" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                            <BarChart3 size={28} />
                        </div>
                        <h3>Analytics</h3>
                        <p>View counterfeit heatmaps, supply chain flow data, and regional risk dashboards</p>
                        <span className="nav-card-cta">View Analytics <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/medicine-search" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                            <Pill size={28} />
                        </div>
                        <h3>Medicine Search</h3>
                        <p>Search any medicine using AI to get full details — composition, uses, side effects, pricing</p>
                        <span className="nav-card-cta">Search Medicines <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/batch-tracker" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#FBBF24' }}>
                            <Activity size={28} />
                        </div>
                        <h3>Batch Tracker</h3>
                        <p>Monitor real-time batch registrations, transfers, and approvals as they happen live</p>
                        <span className="nav-card-cta">Track Batches <ArrowRight size={14} /></span>
                    </Link>
                    <Link to="/supply-chain" className="nav-card">
                        <div className="nav-card-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#60A5FA' }}>
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
