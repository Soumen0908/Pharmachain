import React from 'react';

const shimmerStyle = {
    background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
    borderRadius: 'var(--radius-md)',
};

export function SkeletonBlock({ width = '100%', height = '20px', style = {} }) {
    return <div style={{ ...shimmerStyle, width, height, ...style }} />;
}

export function CardSkeleton({ count = 4 }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(count, 4)}, 1fr)`, gap: '20px' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="glass-card" style={{ padding: '24px' }}>
                    <SkeletonBlock height="40px" width="40px" style={{ borderRadius: '50%', marginBottom: '16px' }} />
                    <SkeletonBlock height="28px" width="60%" style={{ marginBottom: '8px' }} />
                    <SkeletonBlock height="14px" width="80%" />
                </div>
            ))}
        </div>
    );
}

export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="glass-card" style={{ padding: '20px' }}>
            <SkeletonBlock height="18px" width="30%" style={{ marginBottom: '20px' }} />
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                    <SkeletonBlock height="16px" width="15%" />
                    <SkeletonBlock height="16px" width="25%" />
                    <SkeletonBlock height="16px" width="35%" />
                    <SkeletonBlock height="16px" width="20%" />
                </div>
            ))}
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="glass-card" style={{ padding: '24px' }}>
            <SkeletonBlock height="20px" width="40%" style={{ marginBottom: '24px' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '200px' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                    <SkeletonBlock key={i} width="100%" height={`${30 + Math.random() * 70}%`} />
                ))}
            </div>
        </div>
    );
}

export function PageSkeleton() {
    return (
        <div className="page" style={{ opacity: 0.7 }}>
            <div style={{ marginBottom: '30px' }}>
                <SkeletonBlock height="32px" width="250px" style={{ marginBottom: '8px' }} />
                <SkeletonBlock height="16px" width="400px" />
            </div>
            <CardSkeleton count={4} />
            <div style={{ marginTop: '24px' }}>
                <ChartSkeleton />
            </div>
        </div>
    );
}
