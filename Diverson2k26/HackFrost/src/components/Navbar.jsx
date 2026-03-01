import React, { useState, useMemo } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useWeb3 } from '../context/Web3Context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Home, ShieldCheck, QrCode, LayoutDashboard, BarChart3, ArrowLeftRight, PlusCircle, ClipboardCheck, Settings, Trophy, Sun, Moon, User, LogIn, LogOut, Zap, Heart, Search, Activity, Truck, History } from 'lucide-react';
import './Navbar.css';

const ROLE_LABELS = {
    manufacturer: { label: 'Manufacturer', color: 'emerald' },
    distributor: { label: 'Distributor', color: 'blue' },
    retailer: { label: 'Retailer', color: 'violet' },
    inspector: { label: 'Inspector', color: 'amber' },
    auditor: { label: 'Auditor', color: 'info' },
};

export default function Navbar() {
    const { account, role, isConnected, connectWallet, loading, truncateAddress } = useWeb3();
    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout: authLogout } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const roleMeta = useMemo(() => ROLE_LABELS[role] || { label: 'Consumer', color: 'default' }, [role]);

    const navLinks = useMemo(() => {
        const links = [
            { to: '/home', label: 'Home', icon: <Home size={15} /> },
            { to: '/features', label: 'Features', icon: <Zap size={15} /> },
            { to: '/about', label: 'About', icon: <Heart size={15} /> },
            { to: '/verify', label: 'Verify', icon: <ShieldCheck size={15} /> },
            { to: '/scan', label: 'Scan', icon: <QrCode size={15} /> },
            { to: '/medicine-search', label: 'Search', icon: <Search size={15} /> },
            { to: '/batch-tracker', label: 'Tracker', icon: <Activity size={15} /> },
            { to: '/supply-chain', label: 'Supply Chain', icon: <Truck size={15} /> },
            { to: '/transactions', label: 'Transactions', icon: <History size={15} /> },
        ];

        // Auth-based links for logged-in users
        if (isAuthenticated && user) {
            if (user.role === 'customer') {
                links.push({ to: '/customer-dashboard', label: 'My Dashboard', icon: <LayoutDashboard size={15} /> });
            }
            if (user.role === 'manufacturer') {
                links.push({ to: '/manufacturer', label: 'Create', icon: <PlusCircle size={15} /> });
                links.push({ to: '/transfer', label: 'Transfer', icon: <ArrowLeftRight size={15} /> });
            }
            links.push({ to: '/rewards', label: 'Rewards', icon: <Trophy size={15} /> });
        }

        // Web3-connected links (blockchain admin pages)
        if (isConnected) {
            if (!isAuthenticated) {
                // Only add if not already added by auth
                links.push({ to: '/rewards', label: 'Rewards', icon: <Trophy size={15} /> });
            }
            links.push({ to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> });
            links.push({ to: '/analytics', label: 'Analytics', icon: <BarChart3 size={15} /> });
            if (!isAuthenticated || user?.role !== 'manufacturer') {
                links.push({ to: '/transfer', label: 'Transfer', icon: <ArrowLeftRight size={15} /> });
                if (role === 'manufacturer') links.push({ to: '/manufacturer', label: 'Create', icon: <PlusCircle size={15} /> });
            }
            if (role === 'inspector') links.push({ to: '/inspector', label: 'Inspect', icon: <ClipboardCheck size={15} /> });
            if (role === 'admin') links.push({ to: '/admin', label: 'Admin', icon: <Settings size={15} /> });
        }

        return links;
    }, [isConnected, role, isAuthenticated, user]);

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/home" className="navbar-brand">
                    <div className="brand-logo">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                            <rect width="24" height="24" rx="6" fill="var(--brand)" />
                            <path d="M12 4L8 8v4l4 4 4-4V8l-4-4z" fill="white" opacity="0.9" />
                            <circle cx="12" cy="11" r="2" fill="white" />
                        </svg>
                    </div>
                    <span className="brand-text">PharmaChain</span>
                </Link>

                <div className={`navbar-links ${mobileOpen ? 'open' : ''}`}>
                    {navLinks.map(link => (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/'}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setMobileOpen(false)}
                        >
                            {link.icon}
                            {link.label}
                        </NavLink>
                    ))}
                </div>

                <div className="navbar-actions">
                    <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>

                    {/* Auth user section */}
                    {isAuthenticated ? (
                        <div className="navbar-user-group">
                            <Link to="/profile" className="navbar-user-chip" title="My Profile">
                                <User size={14} />
                                <span className="navbar-user-name">{user.name?.split(' ')[0]}</span>
                                <span className={`navbar-role-badge ${user.role === 'manufacturer' ? 'role-mfr' : 'role-cust'}`}>
                                    {user.role === 'manufacturer' ? 'MFR' : 'CUST'}
                                </span>
                            </Link>
                            <button className="btn btn-secondary btn-sm" onClick={authLogout} title="Logout">
                                <LogOut size={14} />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login/customer" className="btn btn-primary btn-sm navbar-login-btn">
                            <LogIn size={14} /> Login
                        </Link>
                    )}

                    {/* Wallet section */}
                    {isConnected ? (
                        <div className="wallet-chip">
                            <span className={`role-dot role-${roleMeta.color}`}></span>
                            <span className="wallet-role">{roleMeta.label}</span>
                            <span className="wallet-divider">|</span>
                            <span className="wallet-addr">{truncateAddress(account)}</span>
                        </div>
                    ) : (
                        <button className="btn btn-secondary btn-sm" onClick={connectWallet} disabled={loading}>
                            {loading ? 'Connecting…' : 'Wallet'}
                        </button>
                    )}

                    <button className="mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
                        <div className={`hamburger ${mobileOpen ? 'open' : ''}`}>
                            <span></span><span></span><span></span>
                        </div>
                    </button>
                </div>
            </div>
        </nav>
    );
}
