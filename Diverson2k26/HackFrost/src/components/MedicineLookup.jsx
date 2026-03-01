import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Pill, FlaskConical, ArrowRightLeft, X, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import './MedicineLookup.css';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
const API = `${API_BASE}/medicines`;
const POPULAR = ['Paracetamol', 'Amoxicillin', 'Metformin', 'Aspirin', 'Ibuprofen', 'Azithromycin', 'Cetirizine', 'Omeprazole', 'Dolo 650', 'Crocin'];

export default function MedicineLookup() {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const [isFuzzy, setIsFuzzy] = useState(false);
    const [highlightIdx, setHighlightIdx] = useState(-1);
    const inputRef = useRef(null);
    const wrapperRef = useRef(null);
    const debounceRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(e) {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search suggestions from API
    const fetchSuggestions = useCallback((val) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/search?q=${encodeURIComponent(val)}`);
                const data = await res.json();
                setSuggestions(data.suggestions || []);
                setIsFuzzy(data.fuzzyMatch || false);
                setShowSuggestions((data.suggestions || []).length > 0);
                setHighlightIdx(-1);
            } catch {
                setSuggestions([]);
            }
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
        try {
            const res = await fetch(`${API}/lookup?q=${encodeURIComponent(name)}`);
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                setResult(null);
            }
        } catch {
            setResult(null);
        }
        setLoading(false);
    }

    function handleKeyDown(e) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIdx(i => Math.min(i + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIdx(i => Math.max(i - 1, -1));
        } else if (e.key === 'Enter') {
            if (highlightIdx >= 0 && suggestions[highlightIdx]) {
                doSearch(suggestions[highlightIdx]);
            } else if (query.trim()) {
                doSearch(query);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }

    function clearSearch() {
        setQuery('');
        setResult(null);
        setSearched(false);
        setSuggestions([]);
        inputRef.current?.focus();
    }

    // Highlight matching part in suggestion
    function highlightMatch(text) {
        const q = query.toLowerCase();
        const idx = text.toLowerCase().indexOf(q);
        if (idx === -1) return <>{text}</>;
        return (
            <>
                {text.slice(0, idx)}
                <strong className="ml-match">{text.slice(idx, idx + q.length)}</strong>
                {text.slice(idx + q.length)}
            </>
        );
    }

    return (
        <div className="medicine-lookup">
            <div className="ml-header">
                <div className="ml-icon-wrap"><Sparkles size={22} /></div>
                <div>
                    <h3 className="ml-title">AI Medicine Lookup</h3>
                    <p className="ml-subtitle">Search any medicine to discover its components &amp; substitutes</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="ml-search-wrap" ref={wrapperRef}>
                <div className="ml-search-bar">
                    <Search size={18} className="ml-search-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="ml-search-input"
                        placeholder="Type a medicine name… e.g. Paracetamol, Dolo 650"
                        value={query}
                        onChange={e => handleInputChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => { if (query.length > 0) fetchSuggestions(query); }}
                    />
                    {query && (
                        <button className="ml-clear-btn" onClick={clearSearch}>
                            <X size={14} />
                        </button>
                    )}
                    <button className="ml-search-btn" onClick={() => query.trim() && doSearch(query)}>
                        Search <ChevronRight size={14} />
                    </button>
                </div>

                {showSuggestions && (
                    <div className="ml-suggestions">
                        {isFuzzy && (
                            <div className="ml-fuzzy-hint">
                                <AlertTriangle size={13} /> Did you mean:
                            </div>
                        )}
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                className={`ml-suggestion-item ${i === highlightIdx ? 'ml-suggestion-active' : ''}`}
                                onClick={() => doSearch(s)}
                                onMouseEnter={() => setHighlightIdx(i)}
                            >
                                <Pill size={14} />
                                {highlightMatch(s)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Chips */}
            <div className="ml-chips">
                <span className="ml-chips-label">Popular:</span>
                {POPULAR.map((m, i) => (
                    <button key={i} className="ml-chip" onClick={() => doSearch(m)}>{m}</button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="ml-loading">
                    <div className="spinner"></div>
                    <p>Analyzing {query}…</p>
                </div>
            )}

            {/* Fuzzy Match Notice */}
            {!loading && result && result.fuzzyMatch && (
                <div className="ml-fuzzy-notice animate-fade-up">
                    <AlertTriangle size={16} />
                    <span>Showing results for <strong>{result.matchedAs}</strong> (closest match for "{result.originalQuery}")</span>
                </div>
            )}

            {/* Source Badge */}
            {!loading && result && result.source && (
                <div className="ml-source-badge animate-fade-up">
                    ℹ️ Data sourced from <strong>{result.source}</strong>
                </div>
            )}

            {/* Results */}
            {!loading && result && (
                <div className="ml-results animate-fade-up">
                    <div className="ml-result-header">
                        <div>
                            <h4 className="ml-drug-name">{result.name}</h4>
                            <span className="ml-generic">{result.genericName}</span>
                        </div>
                        <span className="badge badge-teal">{result.category}</span>
                    </div>
                    <p className="ml-description">{result.description}</p>

                    <div className="ml-sections">
                        {/* Components */}
                        <div className="ml-section">
                            <div className="ml-section-header">
                                <FlaskConical size={16} />
                                <h5>Components &amp; Composition</h5>
                            </div>
                            <div className="ml-components-grid">
                                {result.components.map((c, i) => (
                                    <div key={i} className="ml-component-card">
                                        <div className="ml-comp-name">{c.name}</div>
                                        <div className="ml-comp-meta">
                                            <span className="ml-comp-role">{c.role}</span>
                                            <span className="ml-comp-amount">{c.amount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Substitutes */}
                        {result.substitutes && result.substitutes.length > 0 && (
                            <div className="ml-section">
                                <div className="ml-section-header">
                                    <ArrowRightLeft size={16} />
                                    <h5>Available Substitutes</h5>
                                </div>
                                <div className="ml-subs-grid">
                                    {result.substitutes.map((s, i) => (
                                        <div key={i} className="ml-sub-card">
                                            <div className="ml-sub-name">{s.name}</div>
                                            <div className="ml-sub-meta">
                                                <span>{s.manufacturer}</span>
                                                <span className="badge badge-info">{s.strength}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* No Result */}
            {!loading && searched && !result && (
                <div className="ml-no-result animate-fade-up">
                    <Pill size={32} strokeWidth={1.2} />
                    <p>No data found for "<strong>{query}</strong>". Try a different spelling or one of the popular medicines above.</p>
                </div>
            )}
        </div>
    );
}
