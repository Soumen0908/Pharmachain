/**
 * Consumer Incentive / Reward Engine
 * Points for verification, streaks, first-scan bonuses
 */

const POINTS = {
    FIRST_SCAN: 25,
    VERIFICATION: 10,
    STREAK_BONUS: 5,
    REPORT_SUSPICIOUS: 50,
};

export function calculateReward(isFirstScan, streakCount = 0) {
    let points = POINTS.VERIFICATION;
    let reasons = ['Verification scan'];

    if (isFirstScan) {
        points += POINTS.FIRST_SCAN;
        reasons.push('First activation bonus (+25)');
    }

    if (streakCount > 0 && streakCount % 5 === 0) {
        points += POINTS.STREAK_BONUS * (streakCount / 5);
        reasons.push(`Streak bonus x${streakCount / 5}`);
    }

    return { points, reasons };
}

export function getRewardTier(totalPoints) {
    if (totalPoints >= 500) return { tier: 'Platinum', icon: '💎', color: '#a855f7', nextTier: null, pointsNeeded: 0 };
    if (totalPoints >= 200) return { tier: 'Gold', icon: '🥇', color: '#f59e0b', nextTier: 'Platinum', pointsNeeded: 500 - totalPoints };
    if (totalPoints >= 50) return { tier: 'Silver', icon: '🥈', color: '#94a3b8', nextTier: 'Gold', pointsNeeded: 200 - totalPoints };
    return { tier: 'Bronze', icon: '🥉', color: '#cd7f32', nextTier: 'Silver', pointsNeeded: 50 - totalPoints };
}

export { POINTS };
