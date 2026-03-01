import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../context/Web3Context';
import { getRewards } from '../services/offChainStore';
import { getRewardTier, POINTS } from '../services/rewardEngine';
import { Trophy, Wallet, Award, Shield, Star, Unlock, Flame, Eye, Target, Search, Zap, Siren, Lock, ClipboardList, Gem, Medal } from 'lucide-react';
import './Rewards.css';

const BADGES = [
    { id: 'first_scan', name: 'First Scan', Icon: Target, desc: 'Verified your first medicine', threshold: 1 },
    { id: 'five_scans', name: 'Guardian', Icon: Shield, desc: 'Verified 5 medicines', threshold: 5 },
    { id: 'ten_scans', name: 'Protector', Icon: Star, desc: 'Verified 10 medicines', threshold: 10 },
    { id: 'first_activate', name: 'Activator', Icon: Unlock, desc: 'First product activation', threshold: 1 },
    { id: 'streak', name: 'Streak Master', Icon: Flame, desc: '5-day verification streak', threshold: 5 },
    { id: 'reporter', name: 'Watchdog', Icon: Eye, desc: 'Reported a suspicious product', threshold: 1 },
];

const TIER_ICONS = {
    Platinum: <Gem size={14} />,
    Gold: <Medal size={14} />,
    Silver: <Award size={14} />,
    Bronze: <Star size={14} />,
};

const MOCK_LEADERBOARD = [
    { rank: 1, address: '0xf39F...2266', points: 875, tier: 'Platinum' },
    { rank: 2, address: '0x7099...79C8', points: 640, tier: 'Platinum' },
    { rank: 3, address: '0x3C44...93Bc', points: 420, tier: 'Gold' },
    { rank: 4, address: '0x9965...A4e1', points: 310, tier: 'Gold' },
    { rank: 5, address: '0x1523...D6a8', points: 185, tier: 'Silver' },
    { rank: 6, address: '0x2B5A...7f3C', points: 120, tier: 'Silver' },
    { rank: 7, address: '0x8626...dD50', points: 75, tier: 'Silver' },
    { rank: 8, address: '0xdD2F...A5d6', points: 45, tier: 'Bronze' },
];

const RANK_ICONS = [<Trophy size={14} key={1} />, <Medal size={14} key={2} />, <Award size={14} key={3} />];

export default function Rewards() {
    const { account, isConnected, truncateAddress } = useWeb3();
    const [rewards, setRewards] = useState({ total: 0, history: [] });

    useEffect(() => {
        if (account) setRewards(getRewards(account));
    }, [account]);

    const tier = getRewardTier(rewards.total);
    const nextTierProgress = tier.nextTier
        ? ((rewards.total) / (rewards.total + tier.pointsNeeded)) * 100
        : 100;

    const earnedBadges = BADGES.filter(b => {
        const scanCount = rewards.history.filter(h => h.reason.includes('scan') || h.reason.includes('Verification')).length;
        const activations = rewards.history.filter(h => h.reason.includes('activation')).length;
        if (b.id === 'first_scan') return scanCount >= b.threshold;
        if (b.id === 'five_scans') return scanCount >= b.threshold;
        if (b.id === 'ten_scans') return scanCount >= b.threshold;
        if (b.id === 'first_activate') return activations >= b.threshold;
        return false;
    });

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Consumer Rewards</h1>
                <p className="page-subtitle">Earn points for protecting the pharmaceutical supply chain</p>
            </div>

            {!isConnected ? (
                <div className="empty-state glass-card" style={{ padding: '60px' }}>
                    <Wallet size={40} strokeWidth={1.2} style={{ opacity: 0.4, marginBottom: 12 }} />
                    <h3 style={{ marginBottom: '8px' }}>Connect Your Wallet</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Connect your wallet to view your rewards and badges</p>
                </div>
            ) : (
                <>
                    {/* Tier Card */}
                    <div className="rewards-tier-card glass-card animate-fade-up">
                        <div className="tier-info">
                            <div className="tier-icon-wrap" style={{ color: tier.color }}>
                                <span className="tier-icon-big">{tier.icon}</span>
                            </div>
                            <div className="tier-details">
                                <div className="tier-name" style={{ color: tier.color }}>{tier.tier} Tier</div>
                                <div className="tier-points">{rewards.total} Points</div>
                                <div className="tier-address">{truncateAddress(account)}</div>
                            </div>
                        </div>
                        {tier.nextTier && (
                            <div className="tier-progress">
                                <div className="progress-labels">
                                    <span>{tier.tier}</span>
                                    <span>{tier.pointsNeeded} pts to {tier.nextTier}</span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${nextTierProgress}%`, background: tier.color }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Points Breakdown */}
                    <div className="rewards-points-grid animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        {[
                            { label: 'First Scan Bonus', points: POINTS.FIRST_SCAN, Icon: Target },
                            { label: 'Verification Scan', points: POINTS.VERIFICATION, Icon: Search },
                            { label: 'Streak Bonus (per 5)', points: POINTS.STREAK_BONUS, Icon: Flame },
                            { label: 'Report Suspicious', points: POINTS.REPORT_SUSPICIOUS, Icon: Siren },
                        ].map((item, i) => (
                            <div key={i} className="points-card glass-card">
                                <span className="points-icon"><item.Icon size={20} /></span>
                                <span className="points-value">+{item.points}</span>
                                <span className="points-label">{item.label}</span>
                            </div>
                        ))}
                    </div>

                    <div className="rewards-grid">
                        {/* Badges */}
                        <div className="badges-section glass-card animate-fade-up" style={{ animationDelay: '0.2s' }}>
                            <h3><Award size={16} /> Badge Collection</h3>
                            <div className="badges-grid">
                                {BADGES.map((badge, i) => {
                                    const earned = earnedBadges.some(b => b.id === badge.id);
                                    return (
                                        <div key={i} className={`badge-card ${earned ? 'earned' : 'locked'}`}>
                                            <div className="badge-icon-wrap">
                                                <span className="badge-icon-lg">{earned ? <badge.Icon size={24} /> : <Lock size={24} />}</span>
                                            </div>
                                            <div className="badge-name">{badge.name}</div>
                                            <div className="badge-desc">{badge.desc}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Leaderboard */}
                        <div className="leaderboard-section glass-card animate-fade-up" style={{ animationDelay: '0.3s' }}>
                            <h3><Trophy size={16} /> Top Verifiers</h3>
                            <div className="leaderboard-list">
                                {MOCK_LEADERBOARD.map((entry) => (
                                    <div key={entry.rank} className={`lb-row ${entry.rank <= 3 ? 'top-three' : ''}`}>
                                        <div className="lb-rank">
                                            {entry.rank <= 3
                                                ? RANK_ICONS[entry.rank - 1]
                                                : `#${entry.rank}`
                                            }
                                        </div>
                                        <div className="lb-addr">{entry.address}</div>
                                        <div className="lb-tier">{TIER_ICONS[entry.tier] || <Star size={14} />}</div>
                                        <div className="lb-points">{entry.points} pts</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Activity History */}
                    {rewards.history.length > 0 && (
                        <div className="activity-section glass-card animate-fade-up" style={{ animationDelay: '0.4s', marginTop: '20px' }}>
                            <h3><ClipboardList size={16} /> Recent Activity</h3>
                            <div className="activity-list">
                                {rewards.history.slice().reverse().slice(0, 10).map((h, i) => (
                                    <div key={i} className="activity-row">
                                        <span className="activity-reason">{h.reason}</span>
                                        <span className="activity-points" style={{ color: 'var(--success)' }}>+{h.points}</span>
                                        <span className="activity-time">{new Date(h.timestamp).toLocaleDateString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
