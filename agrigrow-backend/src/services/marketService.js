import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simulated market data (in production, this would come from real APIs)
const MARKET_DATA = {
    wheat: { basePrice: 2200, unit: 'per quintal', trend: 'stable', season: 'rabi' },
    rice: { basePrice: 2100, unit: 'per quintal', trend: 'up', season: 'kharif' },
    cotton: { basePrice: 6500, unit: 'per quintal', trend: 'up', season: 'kharif' },
    sugarcane: { basePrice: 350, unit: 'per quintal', trend: 'stable', season: 'annual' },
    soybean: { basePrice: 4500, unit: 'per quintal', trend: 'down', season: 'kharif' },
    maize: { basePrice: 1900, unit: 'per quintal', trend: 'stable', season: 'kharif' },
    groundnut: { basePrice: 5800, unit: 'per quintal', trend: 'up', season: 'kharif' },
    tomato: { basePrice: 25, unit: 'per kg', trend: 'volatile', season: 'year-round' },
    potato: { basePrice: 18, unit: 'per kg', trend: 'down', season: 'rabi' },
    onion: { basePrice: 22, unit: 'per kg', trend: 'volatile', season: 'rabi' }
};

// Regional mandi data
const MANDI_DATA = {
    'Maharashtra': ['Nashik', 'Pune', 'Nagpur', 'Kolhapur'],
    'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala'],
    'Uttar Pradesh': ['Lucknow', 'Agra', 'Kanpur', 'Varanasi'],
    'Madhya Pradesh': ['Indore', 'Bhopal', 'Jabalpur', 'Gwalior'],
    'Gujarat': ['Ahmedabad', 'Rajkot', 'Surat', 'Vadodara'],
    'Rajasthan': ['Jaipur', 'Jodhpur', 'Kota', 'Udaipur'],
    'Karnataka': ['Bangalore', 'Hubli', 'Belgaum', 'Mysore'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Salem']
};

export class MarketService {
    constructor() {
        // Initialize services
    }

    /**
     * Get market trends for all or specific crops
     * @param {Array} crops - Optional list of specific crops
     * @returns {Promise<Object>} - Market trends data
     */
    async getMarketTrends(crops = []) {
        try {
            let cropsToAnalyze = crops.length > 0 
                ? Object.fromEntries(
                    Object.entries(MARKET_DATA).filter(([crop]) => 
                        crops.map(c => c.toLowerCase()).includes(crop)
                    )
                )
                : MARKET_DATA;

            const trends = Object.entries(cropsToAnalyze).map(([crop, data]) => ({
                cropName: crop,
                currentPrice: this.addPriceVariation(data.basePrice),
                priceUnit: data.unit,
                trend: data.trend,
                season: data.season,
                weeklyChange: this.getRandomChange(data.trend),
                monthlyChange: this.getRandomChange(data.trend) * 2,
                lastUpdated: new Date().toISOString()
            }));

            return {
                success: true,
                data: trends,
                summary: await this.generateTrendSummary(trends)
            };
        } catch (error) {
            console.error('Market trends error:', error.message);
            throw new Error('Failed to fetch market trends');
        }
    }

    /**
     * Analyze market for specific crop
     * @param {string} cropName - Crop to analyze
     * @param {string} region - Optional region/state
     * @returns {Promise<Object>} - Detailed market analysis
     */
    async analyzeCropMarket(cropName, region = null) {
        try {
            const crop = cropName.toLowerCase();
            const baseData = MARKET_DATA[crop] || { basePrice: 2000, unit: 'per quintal', trend: 'unknown' };
            const mandis = region ? (MANDI_DATA[region] || ['Local Mandi']) : ['Local Mandi'];

            // Generate mandi-wise prices
            const mandiPrices = mandis.map(mandi => ({
                mandiName: mandi,
                price: this.addPriceVariation(baseData.basePrice, 15),
                arrivals: Math.floor(Math.random() * 500) + 100,
                trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)]
            }));

            // Find best selling location
            const bestMandi = mandiPrices.reduce((best, current) => 
                current.price > best.price ? current : best
            );

            // Use AI for detailed analysis
            const aiAnalysis = await this.generateMarketInsights({
                crop: cropName,
                region,
                currentPrice: baseData.basePrice,
                mandiPrices
            });

            return {
                success: true,
                cropName,
                region,
                currentMSP: baseData.basePrice,
                priceUnit: baseData.unit,
                mandiPrices,
                bestSellingLocation: bestMandi,
                seasonalTrend: baseData.season,
                aiInsights: aiAnalysis,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Crop market analysis error:', error.message);
            throw new Error('Failed to analyze crop market');
        }
    }

    /**
     * Generate AI-driven market insights
     * @param {Object} marketData - Market data to analyze
     * @returns {Promise<Object>} - AI insights
     */
    async generateMarketInsights(marketData) {
        try {
            const prompt = `
You are an agricultural market analyst. Analyze this market data and provide insights for farmers.

Crop: ${marketData.crop}
Region: ${marketData.region || 'India'}
Current Price: ₹${marketData.currentPrice} per quintal
${marketData.mandiPrices ? `Mandi Prices: ${JSON.stringify(marketData.mandiPrices)}` : ''}

Provide actionable insights as JSON:
{
    "priceOutlook": "Short description of expected price movement",
    "bestTimeToSell": "Recommended selling window",
    "storageAdvice": "Should farmer store or sell now",
    "demandFactors": ["Factor 1 affecting demand", "Factor 2"],
    "risks": ["Risk 1", "Risk 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"],
    "recommendation": "Clear, actionable recommendation for the farmer",
    "confidenceLevel": "High/Medium/Low"
}
`;

            const result = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const text = result.text.replace(/```json|```/g, '').trim();
            return JSON.parse(text);
        } catch (error) {
            console.error('AI insights error:', error.message);
            return {
                recommendation: 'Unable to generate AI insights. Please check current mandi prices.',
                confidenceLevel: 'Low'
            };
        }
    }

    /**
     * Get price advice for selling decision
     * @param {string} cropName - Crop name
     * @param {number} quantity - Optional quantity in quintals
     * @param {string} region - Optional farmer's region
     * @returns {Promise<Object>} - Selling advice
     */
    async getPriceAdvice(cropName, quantity = 10, region = null) {
        try {
            const crop = cropName.toLowerCase();
            const baseData = MARKET_DATA[crop] || { basePrice: 2000, unit: 'per quintal' };
            const currentPrice = this.addPriceVariation(baseData.basePrice);

            const prompt = `
A farmer wants advice on selling their ${cropName} crop.

Details:
- Quantity: ${quantity} quintals
- Current Market Price: ₹${currentPrice} per quintal
- Region: ${region || 'Not specified'}
- Season: ${baseData.season || 'Not specified'}
- Current Trend: ${baseData.trend || 'Unknown'}

Provide selling advice as JSON:
{
    "shouldSellNow": true/false,
    "reasoning": "Why they should or shouldn't sell now",
    "expectedRevenue": "Calculated revenue at current price",
    "priceForcast": {
        "oneWeek": "Expected price in 1 week",
        "oneMonth": "Expected price in 1 month",
        "trend": "up/down/stable"
    },
    "alternativeOptions": ["Option 1", "Option 2"],
    "storageRecommendation": {
        "shouldStore": true/false,
        "duration": "Recommended storage duration",
        "expectedBenefit": "Expected price increase if stored"
    },
    "sellingStrategy": "Detailed strategy for best returns",
    "nearbyMandis": ["Recommended mandi 1", "Recommended mandi 2"]
}
`;

            const result = await genAI.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            const text = result.text.replace(/```json|```/g, '').trim();
            const advice = JSON.parse(text);

            return {
                success: true,
                cropName,
                quantity,
                currentPrice,
                estimatedTotal: currentPrice * quantity,
                advice,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Price advice error:', error.message);
            throw new Error('Failed to generate price advice');
        }
    }

    /**
     * Generate summary of market trends
     */
    async generateTrendSummary(trends) {
        const upTrends = trends.filter(t => t.trend === 'up').map(t => t.cropName);
        const downTrends = trends.filter(t => t.trend === 'down').map(t => t.cropName);

        return {
            totalCrops: trends.length,
            rising: upTrends,
            falling: downTrends,
            stable: trends.filter(t => t.trend === 'stable').map(t => t.cropName),
            marketSentiment: upTrends.length > downTrends.length ? 'Bullish' : 
                             downTrends.length > upTrends.length ? 'Bearish' : 'Neutral'
        };
    }

    // Helper: Add random variation to base price
    addPriceVariation(basePrice, maxVariation = 10) {
        const variation = (Math.random() - 0.5) * 2 * (basePrice * maxVariation / 100);
        return Math.round(basePrice + variation);
    }

    // Helper: Get random percentage change based on trend
    getRandomChange(trend) {
        const base = { up: 3, down: -3, stable: 0, volatile: 0 }[trend] || 0;
        const variation = (Math.random() - 0.5) * 4;
        return Math.round((base + variation) * 10) / 10;
    }
}

export default new MarketService();
