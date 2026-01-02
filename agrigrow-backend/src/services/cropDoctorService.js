import {GoogleGenAI} from '@google/genai';
import dotenv from 'dotenv';
import { json } from 'express';
dotenv.config();

const genAI = new GoogleGenAI({apiKey:process.env.GEMINI_API_KEY});

async function generateCropDiseaseUsingImage(imageBuffer, mimeType) {
    console.log("In generatedCropDiseaseUsingImage", imageBuffer, mimeType);
    // 3. Convert Buffer to Generative Part
    const imagePart = {
        inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: "image/jpeg",
        },
    };

    const prompt = `
        Analyze this crop or plant image and extract the details.
        Return ONLY a JSON object with the following properties:
        {
            "name": "{ type: String, required: true, unique: true }",
            "cropName": "{ type: String, required: true }",
            "severity": "{ type: String, enum: ['Low', 'Medium', 'High'] }",
            "symptoms": "[String]",
            "treatment": {
                "fungicide": "String",
                "dosage": "String",
                "steps": "[String]",
                "safetyNotes": "[String]",
                "source": "String"
            },
            "organicAlternatives": {
                "method": "String",
                "materials": "[String]",
                "process": "[String]"
            },
            "preventionMethods": "[String]",
            "embeddingId": "String"
        }
        Do not include markdown formatting like \`\`\`json.
    `;

    try {
        console.log(`Generating details for image. Size: ${imageBuffer.length}, Type: ${mimeType}`);
        const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                {
                    role: 'user',
                    parts: [
                        { text: prompt },
                        imagePart
                    ]
                }
            ]
        });
        const text = result.text.replace(/```json|```/g, '').trim(); // Clean up markdown if present
        console.log("Gemini Response:", text);
        return JSON.parse(text);
    } catch (error) {
        console.error("Vision Error Full:", error);
        if (error.response) {
            console.error("Vision Erkror Response:", JSON.stringify(error.response, null, 2));
        }
        throw new Error("Failed to analyze image");
    }
}

async function generateDiseaseUsingContext(userInput){
    const prompt = `
        You are an AI that processes user input related to crops and crop diseases and responds ONLY with a valid JSON object.

        Behavior rules:

        First, analyze the user input.

        If the input is related to crops or crop diseases AND contains clear details such as crop name, symptoms, affected parts, or condition, generate a structured diagnosis.

        If the input is crop-related BUT lacks sufficient details, ask for more information.

        If the input is personal, casual, abusive, or unrelated to crops or crop diseases, return an error response.

        If the user input is crop-related but missing required details, return ONLY this JSON object:

        {
        "message": "Please provide a detailed description including the crop name, observed symptoms, and affected parts."
        }

        If the user input contains sufficient crop-related details, return ONLY a JSON object in the following exact structure.
        Do not add extra fields.
        Do not include explanations or markdown.

        {
        "name": "string",
        "cropName": "string",
        "severity": "Low | Medium | High",
        "symptoms": ["string"],
        "treatment": {
        "fungicide": "string",
        "dosage": "string",
        "steps": ["string"],
        "safetyNotes": ["string"],
        "source": "string"
        },
        "organicAlternatives": {
        "method": "string",
        "materials": ["string"],
        "process": ["string"]
        },
        "preventionMethods": ["string"],
        "embeddingId": "string"
        }
        If the user input is NOT related to crops or crop diseases, return ONLY this JSON object:
        {
        "error": {
        "status": 500,
        "message": "Internal Server Error"
        }
        }

        Output constraints:

        Output must be valid JSON only

        No markdown

        No comments

        No extra text

        No stringified JSON

        Follow these rules strictly and consistently.
        Context:${userInput}
    `
    const response = await genAI.models.generateContent({
        model:"gemini-2.5-flash",
        contents: prompt
    });
    return JSON.parse(response.text);
}

// async function generateDiseaseUsingVoice()

export {generateCropDiseaseUsingImage,generateDiseaseUsingContext};