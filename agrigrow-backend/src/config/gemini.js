import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;

export function initGemini() {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('✅ Gemini API initialized successfully');
    return genAI;
  } catch (error) {
    console.error('❌ Gemini initialization failed:', error.message);
    process.exit(1);
  }
}

export function getGeminiClient() {
  if (!genAI) {
    initGemini();
  }
  return genAI;
}

// Get vision model for image analysis
export function getVisionModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: 'gemini-1.5-pro-vision' });
}

// Get text model for text processing
export function getTextModel() {
  const client = getGeminiClient();
  return client.getGenerativeModel({ model: 'gemini-1.5-pro' });
}
