import { GoogleGenAI } from '@google/genai';
import { Scheme } from '../models/Scheme.js';
import { querySchemes, storeVector } from './vectorService.js';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Find eligible government schemes for a farmer
 * @param {Object} farmerProfile - Farmer's profile with land, crops, region
 * @returns {Promise<Array>} - List of eligible schemes with match scores
 */
async function findEligibleSchemes(farmerProfile) {
    try {
        const { landSize, region, crops, farmerType, income } = farmerProfile;

        // First try RAG-based search
        let ragResults = [];
        try {
            ragResults = await querySchemes(farmerProfile);
        } catch (ragError) {
            console.log('RAG search failed, using DB fallback:', ragError.message);
        }

        // Also query MongoDB for schemes
        const dbQuery = {};
        
        if (landSize) {
            dbQuery['eligibility.minLand'] = { $lte: landSize };
            dbQuery['eligibility.maxLand'] = { $gte: landSize };
        }
        
        if (region) {
            dbQuery.$or = [
                { 'eligibility.regions': { $in: [region, 'All India'] } },
                { 'eligibility.regions': { $size: 0 } }
            ];
        }
        
        if (crops && crops.length > 0) {
            dbQuery.$or = dbQuery.$or || [];
            dbQuery.$or.push(
                { 'eligibility.crops': { $in: crops } },
                { 'eligibility.crops': { $size: 0 } }
            );
        }

        const dbSchemes = await Scheme.find(dbQuery).lean();

        // Merge RAG and DB results
        const schemeMap = new Map();
        
        // Add DB results
        dbSchemes.forEach(scheme => {
            schemeMap.set(scheme._id.toString(), {
                ...scheme,
                matchScore: calculateMatchScore(scheme, farmerProfile),
                source: 'database'
            });
        });

        // Add RAG results with scores
        ragResults.forEach(result => {
            const existingScheme = schemeMap.get(result.id);
            if (existingScheme) {
                existingScheme.ragScore = result.score;
                existingScheme.matchScore = Math.max(existingScheme.matchScore, result.score);
            } else {
                schemeMap.set(result.id, {
                    id: result.id,
                    ...result.metadata,
                    matchScore: result.score,
                    source: 'rag'
                });
            }
        });

        // Sort by match score and return
        const eligibleSchemes = Array.from(schemeMap.values())
            .sort((a, b) => b.matchScore - a.matchScore);

        return eligibleSchemes;
    } catch (error) {
        console.error('Scheme eligibility error:', error.message);
        throw new Error('Failed to find eligible schemes');
    }
}

/**
 * Calculate match score between scheme and farmer profile
 * @param {Object} scheme - Scheme document
 * @param {Object} farmerProfile - Farmer profile
 * @returns {number} - Match score 0-1
 */
function calculateMatchScore(scheme, farmerProfile) {
    let score = 0;
    let totalCriteria = 0;

    const eligibility = scheme.eligibility || {};

    // Land size match
    if (eligibility.minLand !== undefined && eligibility.maxLand !== undefined) {
        totalCriteria++;
        if (farmerProfile.landSize >= eligibility.minLand && 
            farmerProfile.landSize <= eligibility.maxLand) {
            score++;
        }
    }

    // Region match
    if (eligibility.regions && eligibility.regions.length > 0) {
        totalCriteria++;
        if (eligibility.regions.includes(farmerProfile.region) || 
            eligibility.regions.includes('All India')) {
            score++;
        }
    }

    // Crop match
    if (eligibility.crops && eligibility.crops.length > 0 && 
        farmerProfile.crops && farmerProfile.crops.length > 0) {
        totalCriteria++;
        const cropMatch = farmerProfile.crops.some(crop => 
            eligibility.crops.includes(crop)
        );
        if (cropMatch) {
            score++;
        }
    }

    // Farmer type match
    if (eligibility.farmerTypes && eligibility.farmerTypes.length > 0) {
        totalCriteria++;
        if (eligibility.farmerTypes.includes(farmerProfile.farmerType)) {
            score++;
        }
    }

    return totalCriteria > 0 ? score / totalCriteria : 0.5;
}

/**
 * Get all available schemes
 * @param {Object} filters - Optional filters
 * @returns {Promise<Array>} - All schemes
 */
async function getAllSchemes(filters = {}) {
    try {
        const query = {};
        
        if (filters.category) {
            query.category = filters.category;
        }

        const schemes = await Scheme.find(query)
            .sort({ createdAt: -1 })
            .lean();

        return schemes;
    } catch (error) {
        console.error('Get schemes error:', error.message);
        throw new Error('Failed to fetch schemes');
    }
}

/**
 * Get scheme details by ID
 * @param {string} schemeId - Scheme ID
 * @returns {Promise<Object>} - Scheme details
 */
async function getSchemeById(schemeId) {
    try {
        const scheme = await Scheme.findById(schemeId).lean();
        
        if (!scheme) {
            throw new Error('Scheme not found');
        }

        return scheme;
    } catch (error) {
        console.error('Get scheme error:', error.message);
        throw new Error('Failed to fetch scheme details');
    }
}

/**
 * Use AI to analyze scheme eligibility in detail
 * @param {Object} scheme - Scheme details
 * @param {Object} farmerProfile - Farmer profile
 * @returns {Promise<Object>} - Detailed eligibility analysis
 */
async function analyzeEligibility(scheme, farmerProfile) {
    try {
        const prompt = `
Analyze if this farmer is eligible for the government scheme.

Scheme Details:
- Name: ${scheme.name}
- Category: ${scheme.category}
- Description: ${scheme.description}
- Eligibility Criteria:
  - Farmer Types: ${scheme.eligibility?.farmerTypes?.join(', ') || 'Any'}
  - Land Range: ${scheme.eligibility?.minLand || 0} - ${scheme.eligibility?.maxLand || 'No limit'} acres
  - Eligible Crops: ${scheme.eligibility?.crops?.join(', ') || 'Any'}
  - Regions: ${scheme.eligibility?.regions?.join(', ') || 'All India'}
  - Other Criteria: ${scheme.eligibility?.otherCriteria?.join(', ') || 'None'}

Farmer Profile:
- Land Size: ${farmerProfile.landSize} acres
- Region: ${farmerProfile.region}
- Crops: ${farmerProfile.crops?.join(', ') || 'Not specified'}
- Farmer Type: ${farmerProfile.farmerType || 'Not specified'}
- Annual Income: ${farmerProfile.income || 'Not specified'}

Provide eligibility analysis as JSON:
{
    "isEligible": true/false,
    "eligibilityScore": 0-100,
    "matchedCriteria": ["List of criteria the farmer meets"],
    "unmatchedCriteria": ["List of criteria not met"],
    "recommendation": "Detailed recommendation for the farmer",
    "nextSteps": ["Step 1 to apply", "Step 2"],
    "documentsNeeded": ["Document 1", "Document 2"],
    "estimatedBenefit": "Estimated benefit amount or description"
}
`;

        const result = await genAI.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        const text = result.text.replace(/```json|```/g, '').trim();
        return JSON.parse(text);
    } catch (error) {
        console.error('Eligibility analysis error:', error.message);
        throw new Error('Failed to analyze eligibility');
    }
}

/**
 * Add a new scheme to database and vector store
 * @param {Object} schemeData - Scheme data
 * @returns {Promise<Object>} - Created scheme
 */
async function addScheme(schemeData) {
    try {
        const scheme = new Scheme(schemeData);
        await scheme.save();

        // Also store in vector DB for RAG
        const schemeText = `
            ${scheme.name}: ${scheme.description}
            Category: ${scheme.category}
            Benefit: ${scheme.benefit}
            Eligible for: ${scheme.eligibility?.farmerTypes?.join(', ')}
            Crops: ${scheme.eligibility?.crops?.join(', ')}
            Regions: ${scheme.eligibility?.regions?.join(', ')}
            Land range: ${scheme.eligibility?.minLand}-${scheme.eligibility?.maxLand} acres
        `;

        try {
            await storeVector(scheme._id.toString(), schemeText, {
                name: scheme.name,
                category: scheme.category,
                type: 'scheme'
            }, 'schemes');
        } catch (vectorError) {
            console.log('Vector storage failed, scheme saved to DB only:', vectorError.message);
        }

        return scheme;
    } catch (error) {
        console.error('Add scheme error:', error.message);
        throw new Error('Failed to add scheme');
    }
}

/**
 * Search schemes by keyword
 * @param {string} keyword - Search keyword
 * @returns {Promise<Array>} - Matching schemes
 */
async function searchSchemes(keyword) {
    try {
        const schemes = await Scheme.find({
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { 'eligibility.crops': { $regex: keyword, $options: 'i' } }
            ]
        }).lean();

        return schemes;
    } catch (error) {
        console.error('Search schemes error:', error.message);
        throw new Error('Failed to search schemes');
    }
}

export {
    findEligibleSchemes,
    getAllSchemes,
    getSchemeById,
    analyzeEligibility,
    addScheme,
    searchSchemes,
    calculateMatchScore
};
