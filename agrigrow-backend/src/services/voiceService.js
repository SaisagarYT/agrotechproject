import { GoogleGenAI } from '@google/genai';
import { queryVectors } from './vectorService.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Process voice query and generate agricultural advice
 * @param {string} transcript - Voice transcript from frontend
 * @param {string} language - Language preference (default: 'en')
 * @returns {Promise<Object>} - AI response with advice
 */
async function processVoiceQuery(transcript, language = 'en') {
    try {
        // First, try to find relevant context from RAG
        let ragContext = '';
        try {
            const relevantDocs = await queryVectors(transcript, 3, 'treatments');
            if (relevantDocs.length > 0) {
                ragContext = relevantDocs
                    .map(doc => doc.metadata?.text || '')
                    .filter(text => text)
                    .join('\n\n');
            }
        } catch (ragError) {
            console.log('RAG query failed, proceeding without context:', ragError.message);
        }

        const prompt = `
You are a helpful agricultural assistant for farmers. You help with:
- Crop disease identification and treatment
- Farming best practices
- Government schemes and subsidies
- Market prices and selling advice
- Weather-related farming tips

${ragContext ? `Relevant Information from Knowledge Base:\n${ragContext}\n\n` : ''}

Farmer's Question: "${transcript}"

Instructions:
1. Provide practical, actionable advice
2. Use simple language that farmers can understand
3. If it's about crop diseases, suggest both chemical and organic solutions
4. If it's about schemes, mention eligibility criteria
5. Keep response concise but comprehensive
6. If the question is not related to agriculture, politely redirect to farming topics

Respond in a conversational, friendly tone. ${language !== 'en' ? `Respond in ${language} language.` : ''}

Provide your response as a JSON object:
{
    "response": "Your helpful response text here",
    "category": "disease|scheme|market|weather|general",
    "followUpQuestions": ["Optional follow-up question 1", "Optional follow-up question 2"],
    "actionItems": ["Practical step 1", "Practical step 2"]
}
`;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = result.text.replace(/```json|```/g, '').trim();
        
        try {
            return JSON.parse(text);
        } catch (parseError) {
            // If JSON parsing fails, return as plain response
            return {
                response: text,
                category: 'general',
                followUpQuestions: [],
                actionItems: []
            };
        }
    } catch (error) {
        console.error('Voice processing error:', error.message);
        throw new Error('Failed to process voice query');
    }
}

/**
 * Generate crop-specific advice from voice query
 * @param {string} cropName - Crop mentioned in query
 * @param {string} issue - Issue description
 * @returns {Promise<Object>} - Detailed crop advice
 */
async function getCropAdvice(cropName, issue) {
    try {
        // Get relevant treatments from RAG
        let ragContext = '';
        try {
            const treatments = await queryVectors(`${cropName} ${issue}`, 3, 'treatments');
            if (treatments.length > 0) {
                ragContext = treatments
                    .map(doc => doc.metadata?.text || '')
                    .join('\n\n');
            }
        } catch (ragError) {
            console.log('Treatment RAG query failed:', ragError.message);
        }

        const prompt = `
You are an expert agricultural advisor. A farmer is asking about their ${cropName} crop.

${ragContext ? `Relevant Treatment Information:\n${ragContext}\n\n` : ''}

Issue described: "${issue}"

Provide detailed advice in JSON format:
{
    "cropName": "${cropName}",
    "identifiedIssue": "What you think the problem is",
    "severity": "Low|Medium|High",
    "immediateActions": ["Step 1", "Step 2"],
    "treatment": {
        "chemical": {
            "product": "Product name",
            "dosage": "Application instructions",
            "frequency": "How often to apply"
        },
        "organic": {
            "method": "Organic solution",
            "preparation": "How to prepare",
            "application": "How to apply"
        }
    },
    "prevention": ["Future prevention tips"],
    "whenToSeekExpert": "When they should consult an agronomist"
}
`;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = result.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('Crop advice error:', error.message);
        throw new Error('Failed to generate crop advice');
    }
}

/**
 * Convert text response to speech-friendly format
 * @param {string} text - Text to convert
 * @returns {Object} - Speech-optimized response
 */
function formatForSpeech(text) {
    // Remove special characters and format for TTS
    const speechText = text
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/\n\n/g, '. ')
        .replace(/\n/g, '. ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
        speechText,
        displayText: text,
        estimatedDuration: Math.ceil(speechText.split(' ').length / 150 * 60) // Approx seconds at 150 wpm
    };
}

/**
 * Detect agricultural intent from voice transcript
 * @param {string} transcript - Voice transcript
 * @returns {Promise<Object>} - Detected intent and entities
 */
async function detectIntent(transcript) {
    try {
        const prompt = `
Analyze this farmer's query and extract intent:
"${transcript}"

Return JSON:
{
    "intent": "disease_query|scheme_query|market_query|weather_query|general_query",
    "entities": {
        "cropName": "extracted crop name or null",
        "disease": "extracted disease or symptom or null",
        "region": "extracted region or null",
        "timeframe": "extracted time reference or null"
    },
    "confidence": 0.0-1.0,
    "requiresMoreInfo": true/false,
    "clarificationQuestion": "Question to ask if more info needed"
}
`;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = result.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('Intent detection error:', error.message);
        return {
            intent: 'general_query',
            entities: {},
            confidence: 0.5,
            requiresMoreInfo: false
        };
    }
}

export {
    processVoiceQuery,
    getCropAdvice,
    formatForSpeech,
    detectIntent
};
