import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', padding: '40px',
                    color: 'var(--text-primary)', textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '16px' }}><AlertTriangle size={48} strokeWidth={1.2} style={{ opacity: 0.5 }} /></div>
                    <h2 style={{
                        fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px',
                        background: 'var(--gradient-warm)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>Something went wrong</h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: '24px' }}>
                        An unexpected error occurred. Please try refreshing the page.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    ><RefreshCw size={14} /> Reload Page</button>
                </div>
            );
        }
        return this.props.children;
    }
}
