
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing.');
}

const ai = new GoogleGenAI({ apiKey });

try {
  const response = await ai.models.list();

  for await (const model of response) {
    console.log('Model:', model.name);
    console.log('Display name:', model.displayName);
    console.log('Supported methods:', model.supportedActions);
    console.log('---------------------------');
  }

} catch (error) {
  console.error('Unable to list models:', error.message);
}
