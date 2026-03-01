import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    Search, Pill, FlaskConical, ArrowRight, X, Sparkles, ChevronRight,
    AlertTriangle, Shield, Clock, DollarSign, Stethoscope, Brain,
    Beaker, Heart, Activity, Package, ArrowLeftRight, Loader2, Info
} from 'lucide-react';
import { searchMedicines, getGeminiMedicineDetails, compareMedicines } from '../services/api';
import './MedicineSearch.css';

const POPULAR = ['Paracetamol', 'Amoxicillin', 'Metformin', 'Aspirin', 'Ibuprofen', 'Azithromycin', 'Cetirizine', 'Omeprazole', 'Dolo 650', 'Crocin', 'Montelukast', 'Atorvastatin'];

export default function MedicineSearch() {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [error, setError] = useState('');
    const [compareMode, setCompareMode] = useState(false);
    const [compareMeds, setCompareMeds] = useState([]);
    const [compareResult, setCompareResult] = useState(null);
    const [compareLoading, setCompareLoading] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem('pharma_recent_searches') || '[]');
        setRecentSearches(saved);
    }, []);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSuggestions(false);
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = useCallback((val) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const data = await searchMedicines(val);
                setSuggestions(data.suggestions || []);
                setShowSuggestions((data.suggestions || []).length > 0);
                setHighlightIdx(-1);
            } catch { setSuggestions([]); }
        }, 200);
    }, []);

    function handleInputChange(val) {
        setQuery(val);
        fetchSuggestions(val);
    }

    async function doSearch(name) {
        setQuery(name);
        setShowSuggestions(false);
        setLoading(true);
        setSearched(true);
        setResult(null);
        setError('');

        // Save to recent
        const updated = [name, ...recentSearches.filter(s => s !== name)].slice(0, 10);
        setRecentSearches(updated);
        localStorage.setItem('pharma_recent_searches', JSON.stringify(updated));

        try {
            const data = await getGeminiMedicineDetails(name);
            if (data.medicine) {
                setResult(data.medicine);
            } else {
                setError('Could not find details for this medicine.');
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch medicine details');
        }
        setLoading(false);
    }

    async function handleCompare() {
        if (compareMeds.length < 2) return;
        setCompareLoading(true);
        setCompareResult(null);
        try {
            const data = await compareMedicines(compareMeds);
            setCompareResult(data.comparison);
        } catch (err) {
            setError('Comparison failed: ' + err.message);
        }
        setCompareLoading(false);
    }

    function toggleCompare(name) {
        if (compareMeds.includes(name)) {
            setCompareMeds(compareMeds.filter(m => m !== name));
        } else if (compareMeds.length < 4) {
            setCompareMeds([...compareMeds, name]);
        }
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowDown') { e.preventDefault(); setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlightIdx(i => Math.max(i - 1, -1)); }
        else if (e.key === 'Enter') {
            if (highlightIdx >= 0 && suggestions[highlightIdx]) doSearch(suggestions[highlightIdx]);
            else if (query.trim()) doSearch(query);
        }
        else if (e.key === 'Escape') setShowSuggestions(false);
    }

    return (
        <div className="medicine-search-page">
            {/* Header Section */}
            <div className="ms-hero">
                <div className="ms-hero-content">
                    <div className="ms-hero-badge"><Sparkles size={14} /> Powered by Gemini AI</div>
                    <h1 className="ms-hero-title">Medicine Intelligence</h1>
                    <p className="ms-hero-desc">
                        Search any medicine to get comprehensive AI-powered details — composition, uses, side effects, 
                        dosage, interactions, pricing, and alternatives.
                    </p>
                </div>
            </div>

            <div className="ms-main">
                {/* Search Section — Full Width */}
                <div className="ms-search-section">
                    <div className="ms-search-bar" ref={wrapperRef}>
                        <Search size={20} className="ms-search-icon" />
                        <input
                            ref={inputRef}
                            type="text"
                            className="ms-search-input"
                            placeholder="Search any medicine... (e.g. Paracetamol, Dolo 650, Azithromycin)"
                            value={query}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        />
                        {query && (
                            <button className="ms-clear-btn" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
                                <X size={16} />
                            </button>
                        )}
                        <button className="ms-search-btn" onClick={() => query.trim() && doSearch(query)} disabled={loading}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : <><Search size={16} /> Search</>}
                        </button>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="ms-suggestions">
                                {suggestions.map((s, i) => (
                                    <button
                                        key={s}
                                        className={`ms-suggestion-item ${i === highlightIdx ? 'highlighted' : ''}`}
                                        onClick={() => doSearch(s)}
                                    >
                                        <Pill size={14} /> {s}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Popular & Recent */}
                    <div className="ms-quick-tags">
                        <span className="ms-tag-label">Popular:</span>
                        {POPULAR.map(m => (
                            <button key={m} className="ms-tag" onClick={() => doSearch(m)}>{m}</button>
                        ))}
                    </div>
                    {recentSearches.length > 0 && (
                        <div className="ms-quick-tags ms-recent">
                            <span className="ms-tag-label"><Clock size={12} /> Recent:</span>
                            {recentSearches.slice(0, 6).map(m => (
                                <button key={m} className="ms-tag ms-tag-recent" onClick={() => doSearch(m)}>{m}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Compare Mode Toggle */}
                <div className="ms-toolbar">
                    <button
                        className={`ms-compare-toggle ${compareMode ? 'active' : ''}`}
                        onClick={() => { setCompareMode(!compareMode); setCompareMeds([]); setCompareResult(null); }}
                    >
                        <ArrowLeftRight size={14} /> {compareMode ? 'Exit Compare' : 'Compare Medicines'}
                    </button>
                    {compareMode && (
                        <div className="ms-compare-info">
                            <span>Select 2-4 medicines to compare:</span>
                            {compareMeds.map(m => (
                                <span key={m} className="ms-compare-chip">{m} <X size={12} onClick={() => toggleCompare(m)} /></span>
                            ))}
                            {compareMeds.length >= 2 && (
                                <button className="btn btn-primary btn-sm" onClick={handleCompare} disabled={compareLoading}>
                                    {compareLoading ? <Loader2 size={14} className="animate-spin" /> : 'Compare'}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="ms-loading">
                        <div className="ms-loading-animation">
                            <Sparkles size={24} className="animate-pulse" />
                            <span>Analyzing with Gemini AI...</span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="ms-error">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                {/* Compare Results */}
                {compareResult && (
                    <div className="ms-compare-result glass-card animate-fade-up">
                        <h3><ArrowLeftRight size={18} /> Medicine Comparison</h3>
                        <div className="ms-compare-grid">
                            {compareResult.medicines?.map((m, i) => (
                                <div key={i} className="ms-compare-card">
                                    <h4>{m.name}</h4>
                                    <div className="ms-compare-field"><span>Category:</span> {m.category}</div>
                                    <div className="ms-compare-field"><span>Primary Use:</span> {m.primaryUse}</div>
                                    <div className="ms-compare-field"><span>Price:</span> {m.avgPrice}</div>
                                    <div className="ms-compare-field">
                                        <span>Side Effects:</span>
                                        <span className={`risk-badge risk-${m.sideEffectRisk}`}>{m.sideEffectRisk}</span>
                                    </div>
                                    <div className="ms-compare-field"><span>Rx Required:</span> {m.prescriptionRequired ? 'Yes' : 'No'}</div>
                                </div>
                            ))}
                        </div>
                        {compareResult.comparison && (
                            <div className="ms-compare-summary">
                                <p>{compareResult.comparison.summary}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Result */}
                {result && !loading && (
                    <div className="ms-result animate-fade-up">
                        {/* Header Card */}
                        <div className="ms-result-header glass-card">
                            <div className="ms-result-title-row">
                                <div>
                                    <h2>{result.name || result.genericName}</h2>
                                    {result.genericName && result.genericName !== result.name && (
                                        <p className="ms-generic">Generic: {result.genericName}</p>
                                    )}
                                </div>
                                <div className="ms-result-badges">
                                    <span className="ms-category-badge">{result.category}</span>
                                    {result.prescriptionRequired && <span className="ms-rx-badge"><Shield size={12} /> Rx Required</span>}
                                    {!result.prescriptionRequired && <span className="ms-otc-badge">OTC</span>}
                                </div>
                            </div>
                            <p className="ms-description">{result.description}</p>
                            {compareMode && (
                                <button className="ms-add-compare" onClick={() => toggleCompare(result.name)}>
                                    {compareMeds.includes(result.name) ? '✓ Selected' : '+ Add to Compare'}
                                </button>
                            )}
                        </div>

                        {/* Detail Panels - Full Width Grid */}
                        <div className="ms-detail-grid">
                            {/* Composition */}
                            <div className="ms-detail-card glass-card">
                                <h3><Beaker size={16} /> Composition</h3>
                                <div className="ms-detail-list">
                                    {(result.composition || []).map((c, i) => (
                                        <div key={i} className="ms-detail-item"><FlaskConical size={13} /> {c}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Uses */}
                            <div className="ms-detail-card glass-card">
                                <h3><Stethoscope size={16} /> Uses & Indications</h3>
                                <div className="ms-detail-list">
                                    {(result.uses || []).map((u, i) => (
                                        <div key={i} className="ms-detail-item"><ChevronRight size={13} /> {u}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Side Effects */}
                            <div className="ms-detail-card glass-card">
                                <h3><AlertTriangle size={16} /> Side Effects</h3>
                                <div className="ms-detail-list">
                                    {(result.sideEffects || []).map((s, i) => (
                                        <div key={i} className="ms-detail-item ms-side-effect"><AlertTriangle size={13} /> {s}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Dosage */}
                            <div className="ms-detail-card glass-card">
                                <h3><Pill size={16} /> Dosage</h3>
                                {result.dosage && (
                                    <div className="ms-dosage-grid">
                                        <div className="ms-dosage-row"><span>Adults:</span><p>{result.dosage.adults}</p></div>
                                        <div className="ms-dosage-row"><span>Children:</span><p>{result.dosage.children}</p></div>
                                        <div className="ms-dosage-row"><span>Frequency:</span><p>{result.dosage.frequency}</p></div>
                                    </div>
                                )}
                            </div>

                            {/* Mechanism of Action */}
                            <div className="ms-detail-card glass-card">
                                <h3><Brain size={16} /> How It Works</h3>
                                <p className="ms-moa">{result.mechanismOfAction}</p>
                                <div className="ms-timing">
                                    {result.onsetOfAction && <div><Clock size={13} /> Onset: {result.onsetOfAction}</div>}
                                    {result.halfLife && <div><Activity size={13} /> Half-life: {result.halfLife}</div>}
                                </div>
                            </div>

                            {/* Precautions */}
                            <div className="ms-detail-card glass-card">
                                <h3><Shield size={16} /> Precautions</h3>
                                <div className="ms-detail-list">
                                    {(result.precautions || []).map((p, i) => (
                                        <div key={i} className="ms-detail-item"><Info size={13} /> {p}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Interactions */}
                            <div className="ms-detail-card glass-card">
                                <h3><ArrowLeftRight size={16} /> Drug Interactions</h3>
                                <div className="ms-detail-list">
                                    {(result.interactions || []).map((d, i) => (
                                        <div key={i} className="ms-detail-item ms-interaction"><AlertTriangle size={13} /> {d}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Contraindications */}
                            <div className="ms-detail-card glass-card">
                                <h3><X size={16} /> Contraindications</h3>
                                <div className="ms-detail-list">
                                    {(result.contraindications || []).map((c, i) => (
                                        <div key={i} className="ms-detail-item ms-contra"><X size={13} /> {c}</div>
                                    ))}
                                </div>
                            </div>

                            {/* Pricing & Storage */}
                            <div className="ms-detail-card glass-card">
                                <h3><DollarSign size={16} /> Price & Storage</h3>
                                <div className="ms-price-info">
                                    {result.avgPrice && <div className="ms-price"><DollarSign size={14} /> Avg: {result.avgPrice}</div>}
                                    {result.manufacturer && <div className="ms-mfr"><Package size={14} /> {result.manufacturer}</div>}
                                    {result.storage && <div className="ms-storage"><Info size={14} /> {result.storage}</div>}
                                </div>
                            </div>

                            {/* Substitutes */}
                            <div className="ms-detail-card glass-card">
                                <h3><ArrowLeftRight size={16} /> Substitutes & Alternatives</h3>
                                <div className="ms-substitutes">
                                    {(result.substitutes || []).map((s, i) => (
                                        <button key={i} className="ms-sub-chip" onClick={() => doSearch(s)}>
                                            {s} <ArrowRight size={12} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Verify CTA */}
                        <div className="ms-verify-cta glass-card">
                            <div className="ms-verify-content">
                                <Shield size={24} />
                                <div>
                                    <h3>Verify This Medicine on Blockchain</h3>
                                    <p>Check if your batch is genuine using our blockchain verification system</p>
                                </div>
                            </div>
                            <Link to="/verify" className="btn btn-primary">
                                <Shield size={16} /> Verify Now <ArrowRight size={14} />
                            </Link>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!loading && !result && searched && !error && (
                    <div className="ms-empty">
                        <Pill size={48} strokeWidth={1} />
                        <h3>No results found</h3>
                        <p>Try searching with a different medicine name or brand name</p>
                    </div>
                )}

                {/* Initial State */}
                {!searched && !loading && (
                    <div className="ms-initial">
                        <div className="ms-feature-grid">
                            <div className="ms-feature-card glass-card">
                                <Sparkles size={28} />
                                <h3>AI-Powered Details</h3>
                                <p>Get comprehensive medicine information powered by Google Gemini AI</p>
                            </div>
                            <div className="ms-feature-card glass-card">
                                <Beaker size={28} />
                                <h3>Full Composition</h3>
                                <p>Active ingredients, dosage forms, and detailed composition breakdown</p>
                            </div>
                            <div className="ms-feature-card glass-card">
                                <AlertTriangle size={28} />
                                <h3>Side Effects & Risks</h3>
                                <p>Know the potential side effects, interactions, and precautions</p>
                            </div>
                            <div className="ms-feature-card glass-card">
                                <ArrowLeftRight size={28} />
                                <h3>Compare Medicines</h3>
                                <p>Compare up to 4 medicines side-by-side to find the best option</p>
                            </div>
                            <div className="ms-feature-card glass-card">
                                <DollarSign size={28} />
                                <h3>Pricing & Alternatives</h3>
                                <p>Average prices in India and available substitute medicines</p>
                            </div>
                            <div className="ms-feature-card glass-card">
                                <Shield size={28} />
                                <h3>Blockchain Verification</h3>
                                <p>Directly verify any medicine batch on the PharmaChain blockchain</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Navigation Section */}
            <div className="ms-nav-section">
                <div className="ms-nav-grid">
                    <Link to="/verify" className="ms-nav-card">
                        <Shield size={22} />
                        <span>Verify Medicine</span>
                        <ArrowRight size={14} />
                    </Link>
                    <Link to="/scan" className="ms-nav-card">
                        <Search size={22} />
                        <span>Scan QR Code</span>
                        <ArrowRight size={14} />
                    </Link>
                    <Link to="/batch-tracker" className="ms-nav-card">
                        <Activity size={22} />
                        <span>Track Batches</span>
                        <ArrowRight size={14} />
                    </Link>
                    <Link to="/customer-dashboard" className="ms-nav-card">
                        <Heart size={22} />
                        <span>My Dashboard</span>
                        <ArrowRight size={14} />
                    </Link>
                </div>
            </div>
        </div>
    );
}
