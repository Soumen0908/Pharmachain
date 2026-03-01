import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import {
    User, Mail, Phone, MapPin, Save, LogOut, ShieldCheck, BadgeCheck,
    Upload, FileCheck, Building2, CreditCard, Pill, Clock, Bell,
    Search, Trash2, AlertTriangle, Settings, Edit3, X, Check
} from 'lucide-react';
import * as api from '../services/api';
import './Profile.css';

export default function Profile() {
    const { user, isAuthenticated, logout, updateProfile, verifyGovtId, refreshUser } = useAuth();
    const toast = useToast();
    const navigate = useNavigate();

    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({
        name: '', email: '', phone: '', address: '',
        companyName: '', licenseNumber: '', govtIdProof: '',
    });
    const [activeTab, setActiveTab] = useState('details');
    const [saving, setSaving] = useState(false);
    const [searchHistory, setSearchHistory] = useState([]);
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login/customer');
            return;
        }
        setForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            companyName: user.companyName || '',
            licenseNumber: user.licenseNumber || '',
            govtIdProof: user.govtIdProof || '',
        });
        loadSearchHistory();
    }, [user, isAuthenticated]);

    async function loadSearchHistory() {
        try {
            const data = await api.getSearchHistory();
            setSearchHistory(data.searchHistory || []);
        } catch { }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await updateProfile(form);
            toast.success('Profile updated successfully');
            setEditing(false);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    }

    async function handleVerifyId() {
        setVerifying(true);
        try {
            await verifyGovtId();
            toast.success('Government ID verified successfully! ✓');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setVerifying(false);
        }
    }

    async function handleRemoveMedicine(name) {
        try {
            await api.removeSavedMedicine(name);
            toast.success('Medicine removed');
            // Refresh user data so saved medicines list updates
            await refreshUser();
        } catch (err) {
            toast.error(err.message);
        }
    }

    function handleFileChange(e) {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, govtIdProof: file.name });
            toast.info(`Selected: ${file.name}`);
        }
    }

    async function handleLogout() {
        await logout();
        toast.info('You have been logged out');
        navigate('/');
    }

    if (!user) return null;

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    return (
        <div className="page profile-page">
            <div className="page-header">
                <div className="profile-header-row">
                    <div>
                        <h1 className="page-title">My Profile</h1>
                        <p className="page-subtitle">
                            <span className={`badge ${user.role === 'manufacturer' ? 'badge-info' : 'badge-success'}`}>
                                {user.role === 'manufacturer' ? 'Manufacturer' : 'Customer'}
                            </span>
                            {user.govtIdVerified && (
                                <span className="verified-badge"><BadgeCheck size={14} /> Verified</span>
                            )}
                        </p>
                    </div>
                    <div className="profile-actions-top">
                        {!editing ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                                <Edit3 size={14} /> Edit Profile
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
                                    {saving ? <span className="spinner-sm"></span> : <><Save size={14} /> Save</>}
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                                    <X size={14} /> Cancel
                                </button>
                            </div>
                        )}
                        <button className="btn btn-danger-outline btn-sm" onClick={handleLogout}>
                            <LogOut size={14} /> Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="profile-tabs">
                <button className={`profile-tab ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
                    <User size={15} /> Details
                </button>
                <button className={`profile-tab ${activeTab === 'medicines' ? 'active' : ''}`} onClick={() => setActiveTab('medicines')}>
                    <Pill size={15} /> Saved Medicines
                </button>
                <button className={`profile-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                    <Clock size={15} /> Search History
                </button>
                <button className={`profile-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
                    <Bell size={15} /> Alerts
                </button>
                <button className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>
                    <Settings size={15} /> Preferences
                </button>
            </div>

            {/* Details Tab */}
            {activeTab === 'details' && (
                <div className="profile-section animate-fade-up">
                    <div className="profile-card glass-card">
                        <h3 className="profile-card-title"><User size={18} /> Personal Information</h3>
                        <div className="profile-fields">
                            <div className="profile-field">
                                <label><User size={14} /> Full Name</label>
                                {editing ? (
                                    <input type="text" value={form.name} onChange={set('name')} />
                                ) : (
                                    <div className="profile-value">{user.name || '—'}</div>
                                )}
                            </div>
                            <div className="profile-field">
                                <label><Mail size={14} /> Email</label>
                                <div className="profile-value">{user.email}</div>
                            </div>
                            <div className="profile-field">
                                <label><Phone size={14} /> Phone</label>
                                {editing ? (
                                    <input type="tel" value={form.phone} onChange={set('phone')} placeholder="Enter phone number" />
                                ) : (
                                    <div className="profile-value">{user.phone || 'Not set'}</div>
                                )}
                            </div>
                            <div className="profile-field">
                                <label><MapPin size={14} /> Address</label>
                                {editing ? (
                                    <input type="text" value={form.address} onChange={set('address')} placeholder="Enter address" />
                                ) : (
                                    <div className="profile-value">{user.address || 'Not set'}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Manufacturer-specific Section */}
                    {user.role === 'manufacturer' && (
                        <div className="profile-card glass-card" style={{ marginTop: 24 }}>
                            <h3 className="profile-card-title"><Building2 size={18} /> Company Information</h3>
                            <div className="profile-fields">
                                <div className="profile-field">
                                    <label><Building2 size={14} /> Company Name</label>
                                    {editing ? (
                                        <input type="text" value={form.companyName} onChange={set('companyName')} />
                                    ) : (
                                        <div className="profile-value">{user.companyName || '—'}</div>
                                    )}
                                </div>
                                <div className="profile-field">
                                    <label><CreditCard size={14} /> Drug License Number</label>
                                    {editing ? (
                                        <input type="text" value={form.licenseNumber} onChange={set('licenseNumber')} />
                                    ) : (
                                        <div className="profile-value">{user.licenseNumber || '—'}</div>
                                    )}
                                </div>
                                <div className="profile-field">
                                    <label><FileCheck size={14} /> Government ID Proof</label>
                                    {editing ? (
                                        <div className="auth-file-upload">
                                            <label className={`auth-file-label ${form.govtIdProof ? 'has-file' : ''}`}>
                                                <Upload size={18} />
                                                {form.govtIdProof || 'Upload Aadhaar / PAN / GST Certificate'}
                                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="profile-value">
                                            {user.govtIdProof ? (
                                                <span className="id-file-name"><FileCheck size={14} /> {user.govtIdProof}</span>
                                            ) : (
                                                <span className="text-muted">No document uploaded</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="profile-field">
                                    <label><ShieldCheck size={14} /> Verification Status</label>
                                    <div className="profile-value">
                                        {user.govtIdVerified ? (
                                            <span className="govt-id-status verified"><BadgeCheck size={16} /> Verified Manufacturer</span>
                                        ) : user.govtIdProof ? (
                                            <div>
                                                <span className="govt-id-status pending"><AlertTriangle size={16} /> Pending Verification</span>
                                                <button className="btn btn-primary btn-sm" onClick={handleVerifyId} disabled={verifying} style={{ marginTop: 8 }}>
                                                    {verifying ? 'Verifying...' : 'Verify Now'}
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="govt-id-status pending"><Upload size={16} /> Upload ID to get verified</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="profile-meta">
                        <small>Account created: {new Date(user.createdAt).toLocaleDateString()}</small>
                        <small>Last updated: {new Date(user.updatedAt).toLocaleDateString()}</small>
                    </div>
                </div>
            )}

            {/* Saved Medicines Tab */}
            {activeTab === 'medicines' && (
                <div className="profile-section animate-fade-up">
                    {(user.savedMedicines || []).length === 0 ? (
                        <div className="empty-state">
                            <Pill size={40} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <h3>No saved medicines</h3>
                            <p>Search and verify medicines, then save them to your profile for quick access.</p>
                            <Link to="/verify" className="btn btn-primary btn-sm" style={{ marginTop: 16 }}>
                                <Search size={14} /> Search Medicines
                            </Link>
                        </div>
                    ) : (
                        <div className="saved-medicines-grid">
                            {user.savedMedicines.map((med, i) => (
                                <div key={i} className="saved-med-card glass-card animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                                    <div className="saved-med-header">
                                        <h4>{med.name}</h4>
                                        <button className="btn-icon-sm" onClick={() => handleRemoveMedicine(med.name)} title="Remove">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    {med.genericName && <p className="saved-med-generic">{med.genericName}</p>}
                                    {med.category && <span className="badge badge-teal">{med.category}</span>}
                                    <small className="saved-med-date">Saved {new Date(med.savedAt).toLocaleDateString()}</small>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Search History Tab */}
            {activeTab === 'history' && (
                <div className="profile-section animate-fade-up">
                    {searchHistory.length === 0 ? (
                        <div className="empty-state">
                            <Search size={40} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <h3>No search history</h3>
                            <p>Your medicine searches will appear here.</p>
                        </div>
                    ) : (
                        <div className="search-history-list">
                            {searchHistory.map((item, i) => (
                                <div key={i} className="search-history-item animate-fade-up" style={{ animationDelay: `${i * 0.03}s` }}>
                                    <Search size={14} className="text-muted" />
                                    <span className="search-query">{item.query}</span>
                                    <span className="search-time">{new Date(item.searchedAt).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Alerts Tab */}
            {activeTab === 'alerts' && (
                <div className="profile-section animate-fade-up">
                    {(user.expiryAlerts || []).length === 0 ? (
                        <div className="empty-state">
                            <Bell size={40} strokeWidth={1.2} style={{ opacity: 0.3, marginBottom: 12 }} />
                            <h3>No expiry alerts</h3>
                            <p>Set expiry alerts when verifying medicines to get notified before they expire.</p>
                        </div>
                    ) : (
                        <div className="alerts-list">
                            {user.expiryAlerts.map((alert, i) => (
                                <div key={i} className="alert-item glass-card">
                                    <Bell size={16} className="text-warning" />
                                    <div>
                                        <strong>{alert.medicineName || alert.batchId}</strong>
                                        <p>Expires: {new Date(alert.expiryDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
                <div className="profile-section animate-fade-up">
                    <div className="profile-card glass-card">
                        <h3 className="profile-card-title"><Settings size={18} /> Preferences</h3>
                        <div className="preferences-list">
                            <div className="preference-item">
                                <div>
                                    <strong>Notifications</strong>
                                    <p>Receive alerts about medicine expiry and updates</p>
                                </div>
                                <label className="toggle-switch">
                                    <input type="checkbox" checked={user.preferences?.notifications ?? true} onChange={async (e) => {
                                        await updateProfile({ preferences: { notifications: e.target.checked } });
                                        toast.success('Preference updated');
                                    }} />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                            <div className="preference-item">
                                <div>
                                    <strong>Language</strong>
                                    <p>Choose your preferred language</p>
                                </div>
                                <select className="pref-select" defaultValue={user.preferences?.language || 'en'}>
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                    <option value="ta">Tamil</option>
                                    <option value="te">Telugu</option>
                                    <option value="bn">Bengali</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
