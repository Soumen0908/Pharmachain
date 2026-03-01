/**
 * Gemini AI Medicine Details API
 * Proxies requests to Google Gemini to get detailed medicine information
 */
const express = require('express');
const router = express.Router();

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || 'AIzaSyCJpd4obM6RqvGkJStFbNQQVGE0rQZ-tmM';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

/**
 * POST /api/gemini/medicine-details
 * Body: { medicineName: "Paracetamol" }
 * Returns: AI-generated medicine details
 */
router.post('/medicine-details', async (req, res) => {
    const { medicineName } = req.body;
    if (!medicineName || !medicineName.trim()) {
        return res.status(400).json({ error: 'medicineName is required' });
    }

    const prompt = `You are a pharmaceutical expert. Provide comprehensive details about the medicine "${medicineName}" in the following JSON format only (no markdown, no explanation, just valid JSON):
{
  "name": "medicine name",
  "genericName": "generic/chemical name",
  "category": "therapeutic category",
  "description": "brief 2-3 sentence description",
  "composition": ["active ingredient 1 with dosage", "active ingredient 2 with dosage"],
  "uses": ["use 1", "use 2", "use 3", "use 4", "use 5"],
  "sideEffects": ["side effect 1", "side effect 2", "side effect 3", "side effect 4"],
  "dosage": {
    "adults": "adult dosage instructions",
    "children": "children dosage instructions",
    "frequency": "how often to take"
  },
  "precautions": ["precaution 1", "precaution 2", "precaution 3"],
  "interactions": ["drug interaction 1", "drug interaction 2"],
  "storage": "storage instructions",
  "manufacturer": "common manufacturer(s) in India",
  "avgPrice": "average price range in INR",
  "prescriptionRequired": true/false,
  "substitutes": ["substitute 1", "substitute 2", "substitute 3"],
  "contraindications": ["contraindication 1", "contraindication 2"],
  "mechanismOfAction": "brief explanation of how the drug works",
  "onsetOfAction": "time to start working",
  "halfLife": "half-life duration"
}

If the medicine name is misspelled, try to identify the correct medicine. If you cannot identify the medicine, return {"error": "Medicine not found", "suggestion": "did you mean X?"}.`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 2048,
                },
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Gemini API error:', errText);
            return res.status(502).json({ error: 'AI service unavailable', details: errText });
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Extract JSON from response (handle possible markdown wrapping)
        let jsonStr = text.trim();
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }

        const parsed = JSON.parse(jsonStr);
        res.json({ success: true, medicine: parsed, source: 'gemini-ai' });
    } catch (err) {
        console.error('Gemini medicine lookup error:', err.message);
        res.status(500).json({ error: 'Failed to get medicine details', details: err.message });
    }
});

/**
 * POST /api/gemini/medicine-compare
 * Body: { medicines: ["Paracetamol", "Ibuprofen"] }
 */
router.post('/medicine-compare', async (req, res) => {
    const { medicines } = req.body;
    if (!medicines || !Array.isArray(medicines) || medicines.length < 2) {
        return res.status(400).json({ error: 'Provide at least 2 medicine names to compare' });
    }

    const prompt = `Compare these medicines: ${medicines.join(', ')}. Return ONLY valid JSON:
{
  "medicines": [
    { "name": "...", "category": "...", "primaryUse": "...", "avgPrice": "...", "sideEffectRisk": "low/medium/high", "prescriptionRequired": true/false }
  ],
  "comparison": {
    "bestFor": { "pain": "...", "fever": "...", "inflammation": "..." },
    "fewestSideEffects": "...",
    "fastestActing": "...",
    "summary": "2-3 sentence comparison summary"
  }
}`;

    try {
        const response = await fetch(GEMINI_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
            }),
        });
        if (!response.ok) return res.status(502).json({ error: 'AI service unavailable' });
        const data = await response.json();
        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
        if (text.startsWith('```')) text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        res.json({ success: true, comparison: JSON.parse(text) });
    } catch (err) {
        res.status(500).json({ error: 'Comparison failed', details: err.message });
    }
});

module.exports = router;
