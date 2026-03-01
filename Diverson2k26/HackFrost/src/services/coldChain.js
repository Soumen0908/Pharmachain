/**
 * Cold Chain Monitor (Simulated IoT Temperature Logging)
 */

export function generateTemperatureLog(batchId, isSensitive = false) {
    const logs = [];
    const baseTemp = isSensitive ? 4 : 22; // Vaccines at 2-8°C
    const now = Date.now();
    const entries = 24; // 24 hours

    for (let i = 0; i < entries; i++) {
        const variation = (Math.random() - 0.5) * (isSensitive ? 3 : 8);
        const temp = baseTemp + variation;
        const excursion = isSensitive ? (temp < 2 || temp > 8) : (temp < 15 || temp > 30);

        logs.push({
            timestamp: now - (entries - i) * 3600000,
            temperature: Math.round(temp * 10) / 10,
            humidity: Math.round(45 + Math.random() * 20),
            excursion,
            batchId,
        });
    }

    return logs;
}

export function analyzeColdChain(logs) {
    const excursions = logs.filter(l => l.excursion);
    const avgTemp = logs.reduce((s, l) => s + l.temperature, 0) / logs.length;
    const maxTemp = Math.max(...logs.map(l => l.temperature));
    const minTemp = Math.min(...logs.map(l => l.temperature));

    return {
        totalReadings: logs.length,
        excursionCount: excursions.length,
        excursionPercent: Math.round((excursions.length / logs.length) * 100),
        avgTemp: Math.round(avgTemp * 10) / 10,
        maxTemp,
        minTemp,
        status: excursions.length === 0 ? 'optimal' : excursions.length < 3 ? 'warning' : 'critical',
    };
}
