/**
 * PharmaChain AI Risk Detection Engine
 * Weighted Trust Score with 5 components + anomaly detection
 */

const WEIGHTS = {
    supplyChainCompleteness: 0.30,
    scanBehavior: 0.25,
    routeConsistency: 0.20,
    timingAnomalies: 0.15,
    inspectorValidation: 0.10,
};

// Known city locations for route analysis (simulated)
const CITY_COORDS = {
    'mumbai': { lat: 19.07, lng: 72.87 },
    'delhi': { lat: 28.61, lng: 77.20 },
    'bangalore': { lat: 12.97, lng: 77.59 },
    'hyderabad': { lat: 17.38, lng: 78.47 },
    'chennai': { lat: 13.08, lng: 80.27 },
    'kolkata': { lat: 22.57, lng: 88.36 },
    'pune': { lat: 18.52, lng: 73.85 },
    'ahmedabad': { lat: 23.02, lng: 72.57 },
    'nagpur': { lat: 21.14, lng: 79.08 },
    'jaipur': { lat: 26.91, lng: 75.78 },
};

function distance(loc1, loc2) {
    const toRad = (d) => d * Math.PI / 180;
    const R = 6371;
    const dLat = toRad(loc2.lat - loc1.lat);
    const dLng = toRad(loc2.lng - loc1.lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(loc1.lat)) * Math.cos(toRad(loc2.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findCity(location) {
    const loc = location.toLowerCase();
    for (const [city, coords] of Object.entries(CITY_COORDS)) {
        if (loc.includes(city)) return coords;
    }
    return null;
}

/**
 * Analyze supply chain completeness
 * Full chain: Manufactured → Distributor → Retailer → Inspected → Sold = 100%
 */
export function analyzeSupplyChain(history, batch) {
    const expectedSteps = ['Manufactured', 'InTransit_ToDistributor', 'AtDistributor', 'InTransit_ToRetailer', 'AtRetailer', 'InspectorApproved', 'Sold'];
    const statusNames = ['Manufactured', 'InTransit_ToDistributor', 'AtDistributor', 'InTransit_ToRetailer', 'AtRetailer', 'InspectorApproved', 'Sold', 'Recalled', 'Flagged'];

    if (!history || history.length === 0) return { score: 0, alerts: ['No supply chain history found'] };

    const completedStatuses = history.map(h => statusNames[Number(h.status)] || 'Unknown');
    let steps = 0;
    const alerts = [];

    for (const expected of expectedSteps) {
        if (completedStatuses.includes(expected)) steps++;
        else break; // Chain must be sequential
    }

    // Check for skipped steps
    const statusIndices = completedStatuses.map(s => expectedSteps.indexOf(s)).filter(i => i >= 0);
    for (let i = 1; i < statusIndices.length; i++) {
        if (statusIndices[i] - statusIndices[i - 1] > 1) {
            alerts.push(`⚠️ Supply chain step skipped between ${expectedSteps[statusIndices[i - 1]]} and ${expectedSteps[statusIndices[i]]}`);
        }
    }

    const score = Math.min(100, (steps / expectedSteps.length) * 100);
    return { score, alerts };
}

/**
 * Analyze scan behavior
 */
export function analyzeScanBehavior(scanHistory) {
    if (!scanHistory || scanHistory.length === 0) return { score: 100, alerts: [] };

    const alerts = [];
    let score = 100;

    // Multiple scans = suspicious
    if (scanHistory.length > 1) {
        score -= 30;
        alerts.push(`⚠️ Product scanned ${scanHistory.length} times (expected: 1)`);
    }

    // Scans from different locations
    const locations = [...new Set(scanHistory.map(s => s.location).filter(Boolean))];
    if (locations.length > 1) {
        score -= 25;
        alerts.push(`🚨 Scanned from ${locations.length} different locations: ${locations.join(', ')}`);
    }

    // Rapid consecutive scans
    for (let i = 1; i < scanHistory.length; i++) {
        const timeDiff = scanHistory[i].timestamp - scanHistory[i - 1].timestamp;
        if (timeDiff < 3600) { // Less than 1 hour
            score -= 15;
            alerts.push('⚠️ Rapid consecutive scans detected');
            break;
        }
    }

    return { score: Math.max(0, score), alerts };
}

/**
 * Analyze route consistency
 */
export function analyzeRoute(history) {
    if (!history || history.length < 2) return { score: 100, alerts: [] };

    const alerts = [];
    let score = 100;

    for (let i = 1; i < history.length; i++) {
        const loc1 = findCity(history[i - 1].location || '');
        const loc2 = findCity(history[i].location || '');

        if (loc1 && loc2) {
            const dist = distance(loc1, loc2);
            const timeDiff = (Number(history[i].timestamp) - Number(history[i - 1].timestamp));
            const hours = timeDiff / 3600;

            // Impossibly fast transfer (> 200 km/h sustained)
            if (hours > 0 && dist / hours > 200) {
                score -= 20;
                alerts.push(`🚨 Impossibly fast transfer: ${Math.round(dist)}km in ${hours.toFixed(1)}hrs`);
            }

            // Very long distance without intermediate stops
            if (dist > 1500) {
                score -= 10;
                alerts.push(`⚠️ Long-distance transfer without intermediate stop: ${Math.round(dist)}km`);
            }
        }
    }

    return { score: Math.max(0, score), alerts };
}

/**
 * Analyze timing anomalies
 */
export function analyzeTimings(history) {
    if (!history || history.length < 2) return { score: 100, alerts: [] };

    const alerts = [];
    let score = 100;

    for (let i = 1; i < history.length; i++) {
        const timeDiff = Number(history[i].timestamp) - Number(history[i - 1].timestamp);
        const days = timeDiff / 86400;

        // Suspiciously fast (< 1 minute between steps)
        if (timeDiff < 60 && i > 1) {
            score -= 15;
            alerts.push(`⚠️ Suspiciously fast transfer at step ${i + 1} (${timeDiff}s)`);
        }

        // Excessive delay (> 30 days)
        if (days > 30) {
            score -= 10;
            alerts.push(`⚠️ Excessive delay at step ${i + 1} (${Math.round(days)} days)`);
        }
    }

    return { score: Math.max(0, score), alerts };
}

/**
 * Inspector validation score
 */
export function analyzeInspection(batch) {
    if (!batch) return { score: 50, alerts: ['No batch data available'] };

    const alerts = [];
    let score = 100;

    if (batch.recalled) {
        score = 0;
        alerts.push('🚨 PRODUCT HAS BEEN RECALLED: ' + (batch.recallReason || 'No reason specified'));
    } else if (Number(batch.status) === 8) { // Flagged
        score = 20;
        alerts.push('🚨 Product flagged by inspector');
    } else if (batch.inspectorApproved) {
        score = 100;
    } else {
        score = 50;
        alerts.push('⚠️ Product not yet inspector-approved');
    }

    return { score, alerts };
}

/**
 * Calculate overall trust score
 */
export function calculateTrustScore(batch, history, scanHistory = []) {
    const supplyChain = analyzeSupplyChain(history, batch);
    const scan = analyzeScanBehavior(scanHistory);
    const route = analyzeRoute(history);
    const timing = analyzeTimings(history);
    const inspection = analyzeInspection(batch);

    const weightedScore = Math.round(
        supplyChain.score * WEIGHTS.supplyChainCompleteness +
        scan.score * WEIGHTS.scanBehavior +
        route.score * WEIGHTS.routeConsistency +
        timing.score * WEIGHTS.timingAnomalies +
        inspection.score * WEIGHTS.inspectorValidation
    );

    const allAlerts = [
        ...supplyChain.alerts,
        ...scan.alerts,
        ...route.alerts,
        ...timing.alerts,
        ...inspection.alerts,
    ];

    let riskLevel = 'Low Risk';
    if (weightedScore < 40) riskLevel = 'High Risk';
    else if (weightedScore < 70) riskLevel = 'Medium Risk';

    return {
        score: Math.max(0, Math.min(100, weightedScore)),
        riskLevel,
        alerts: allAlerts,
        breakdown: {
            supplyChain: { score: supplyChain.score, weight: '30%', label: 'Supply Chain Completeness' },
            scan: { score: scan.score, weight: '25%', label: 'Scan Behavior' },
            route: { score: route.score, weight: '20%', label: 'Route Consistency' },
            timing: { score: timing.score, weight: '15%', label: 'Timing Analysis' },
            inspection: { score: inspection.score, weight: '10%', label: 'Inspector Validation' },
        }
    };
}

/**
 * Counterfeit heat prediction (simulated regional data)
 */
export function getCounterfeitHeatmap() {
    const regions = [
        { name: 'Mumbai', risk: 15, scans: 1240, suspicious: 12 },
        { name: 'Delhi', risk: 35, scans: 980, suspicious: 45 },
        { name: 'Bangalore', risk: 8, scans: 760, suspicious: 5 },
        { name: 'Hyderabad', risk: 12, scans: 650, suspicious: 8 },
        { name: 'Chennai', risk: 22, scans: 540, suspicious: 18 },
        { name: 'Kolkata', risk: 42, scans: 890, suspicious: 62 },
        { name: 'Pune', risk: 10, scans: 430, suspicious: 4 },
        { name: 'Ahmedabad', risk: 28, scans: 620, suspicious: 25 },
        { name: 'Nagpur', risk: 55, scans: 320, suspicious: 48 },
        { name: 'Jaipur', risk: 18, scans: 410, suspicious: 9 },
    ];
    return regions;
}

/**
 * Smart alerts for enterprises
 */
export function generateSmartAlerts(batches, histories) {
    const alerts = [];

    if (!batches || batches.length === 0) return alerts;

    batches.forEach((batch, i) => {
        const history = histories[i] || [];
        if (history.length < 2) return;

        // Distributor holding too long
        const atDistributor = history.find(h => Number(h.status) === 2);
        const afterDistributor = history.find(h => Number(h.status) > 2);
        if (atDistributor && !afterDistributor) {
            const holdTime = (Date.now() / 1000 - Number(atDistributor.timestamp)) / 86400;
            if (holdTime > 7) {
                alerts.push({
                    type: 'warning',
                    title: 'Extended Hold',
                    message: `Batch held at distributor for ${Math.round(holdTime)} days`,
                    batchId: batch.batchId,
                });
            }
        }
    });

    return alerts;
}
