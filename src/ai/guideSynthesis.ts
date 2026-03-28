import { GoogleGenAI } from '@google/genai';
import type { GuideJSON } from '../types/guide.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const GUIDE_PROMPT = `You are an assembly guide generator. Given the full text of a product assembly manual, produce a structured JSON guide.

The output MUST be valid JSON matching this exact schema:
{
  "deviceId": string,       // use the provided device ID
  "deviceName": string,     // product name from the manual
  "totalMinutes": number,   // estimated total assembly time
  "requiresTwoPeople": boolean,
  "twoPersonSteps": number[], // step indices that need 2 people
  "parts": [{ "id": string, "name": string, "quantity": number }],
  "tools": [{ "id": string, "name": string, "required": boolean }],
  "steps": [{
    "index": number,
    "title": string,
    "description": string,
    "durationMin": number,
    "parts": string[],      // part IDs used in this step
    "arLabel": string       // short label for AR overlay (optional)
  }]
}

Be thorough — include every step from the manual. Use clear, concise language for descriptions.
Output ONLY the JSON, no markdown fences, no commentary.`;

export async function synthesizeGuide(manualText: string, deviceId: string): Promise<GuideJSON> {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: GUIDE_PROMPT },
          { text: `Device ID: ${deviceId}\n\nManual text:\n${manualText}` },
        ],
      },
    ],
  });

  const text = response.text ?? '';
  // Strip markdown fences if the model wraps them anyway
  const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
  const guide: GuideJSON = JSON.parse(cleaned);
  return guide;
}
