import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '80vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', color: '#e2e8f0',
            textAlign: 'center', padding: '2rem'
        }}>
            <h1 style={{ fontSize: '6rem', fontWeight: 800, color: '#06b6d4', margin: 0 }}>404</h1>
            <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '2rem' }}>
                Page not found. The page you're looking for doesn't exist.
            </p>
            <Link to="/home" style={{
                padding: '0.75rem 2rem', background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
                color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 600
            }}>
                Go Home
            </Link>
        </div>
    );
}
