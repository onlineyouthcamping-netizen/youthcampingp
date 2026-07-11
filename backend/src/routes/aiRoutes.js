const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const SYSTEM_PROMPT = `You are an expert travel itinerary structurer for a luxury travel company.
Your job is to take raw trip details provided by a travel agent and return ONLY a perfectly structured JSON object — no markdown, no code blocks, no explanations.

STRICT OUTPUT RULES:
- Return only valid JSON matching the schema exactly
- No null values — use empty string "" if unknown
- highlights must be an array of short strings (max 6 per day)
- summaryTiles: one tile per unique experience type found in the route
- driveTimeToNext for the last stop must be ""
- tagline must be emotional and destination-specific, never generic
- Do not add any fields not listed in the schema
- activityType for each day must be one of: "Transfer Day" / "Full Day Explore" / "Wildlife" / "Cultural" / "Adventure" / "Leisure" / "Departure"

JSON SCHEMA TO RETURN:
{
  "hero": {
    "destination": "",
    "clientName": "",
    "duration": "",
    "tripType": "",
    "travelDates": "",
    "groupSize": "",
    "heroImageUrl": "",
    "tagline": ""
  },
  "journeyMap": {
    "summaryTiles": [
      {
        "label": "Distance",
        "value": "120 km",
        "icon": "map"
      }
    ],
    "stops": [
      {
        "name": "",
        "day": 1,
        "type": "Arrival",
        "icon": "plane",
        "driveTime": "2 hrs"
      }
    ]
  },
  "itinerary": {
    "title": "",
    "days": [
      {
        "dayNumber": 1,
        "title": "",
        "description": "",
        "imageUrl": "",
        "stayType": "",
        "mealType": "",
        "activityType": "",
        "highlights": ["", ""]
      }
    ]
  },
  "faq": {
    "title": "Frequently Asked",
    "items": [
      {
        "question": "",
        "answer": ""
      }
    ]
  }
}`;

router.post('/generate-itinerary', async (req, res) => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ success: false, message: 'GEMINI_API_KEY not configured' });
  }

  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, message: 'Prompt is required' });
    }

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const fullPrompt = `${SYSTEM_PROMPT}\n\n---\nTRIP DETAILS FROM AGENT:\n${prompt}\n---\n\nReturn only the JSON object.`;
    
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const text = response.text().trim();
    
    const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(jsonText);

    res.json({ success: true, data: parsed });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
