/**
 * Real-time batch updates via Server-Sent Events (SSE)
 * Clients subscribe and get notified when batches are registered or updated
 */
const express = require('express');
const router = express.Router();

// Connected SSE clients
const clients = new Set();

/**
 * GET /api/live/batch-stream
 * SSE endpoint — clients connect here for real-time batch updates
 */
router.get('/batch-stream', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
    });

    // Send initial connection event
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    clients.add(res);
    console.log(`SSE client connected (${clients.size} total)`);

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
        res.write(`: heartbeat\n\n`);
    }, 30000);

    req.on('close', () => {
        clients.delete(res);
        clearInterval(heartbeat);
        console.log(`SSE client disconnected (${clients.size} remaining)`);
    });
});

/**
 * Broadcast an event to all connected SSE clients
 * @param {string} eventType - 'batch-registered' | 'batch-transferred' | 'batch-inspected' | 'batch-activated'
 * @param {object} payload - Event data
 */
function broadcast(eventType, payload) {
    const message = JSON.stringify({
        type: eventType,
        data: payload,
        timestamp: new Date().toISOString(),
    });

    for (const client of clients) {
        try {
            client.write(`event: ${eventType}\ndata: ${message}\n\n`);
        } catch {
            clients.delete(client);
        }
    }
}

/**
 * GET /api/live/recent-events
 * Returns last 50 events for clients that just connected
 */
const recentEvents = [];
const MAX_EVENTS = 50;

function addEvent(eventType, payload) {
    const event = {
        type: eventType,
        data: payload,
        timestamp: new Date().toISOString(),
    };
    recentEvents.unshift(event);
    if (recentEvents.length > MAX_EVENTS) recentEvents.length = MAX_EVENTS;
    broadcast(eventType, payload);
}

router.get('/recent-events', (req, res) => {
    res.json({ events: recentEvents });
});

module.exports = router;
module.exports.addEvent = addEvent;
module.exports.broadcast = broadcast;
