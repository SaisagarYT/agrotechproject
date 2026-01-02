import express from 'express';
import marketService from '../services/marketService.js';

const router = express.Router();

// GET /api/market/trends - Get market trends for all or specific crops
router.get('/trends', async (req, res) => {
  try {
    const { crops } = req.query;
    const cropList = crops ? crops.split(',').map(c => c.trim()) : [];
    
    const trends = await marketService.getMarketTrends(cropList);
    
    res.json(trends);
  } catch (error) {
    console.error('Market trends error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/market/crop/:cropName - Get detailed analysis for specific crop
router.get('/crop/:cropName', async (req, res) => {
  try {
    const { cropName } = req.params;
    const { region } = req.query;
    
    const analysis = await marketService.analyzeCropMarket(cropName, region);
    
    res.json(analysis);
  } catch (error) {
    console.error('Crop market analysis error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/market/price-advice - Get selling advice
router.post('/price-advice', async (req, res) => {
  try {
    const { cropName, quantity, region } = req.body;
    
    if (!cropName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Crop name is required' 
      });
    }

    const advice = await marketService.getPriceAdvice(cropName, quantity || 10, region);
    
    res.json(advice);
  } catch (error) {
    console.error('Price advice error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/market/insights - Generate AI insights for given data
router.post('/insights', async (req, res) => {
  try {
    const marketData = req.body;
    
    if (!marketData.crop) {
      return res.status(400).json({ 
        success: false, 
        error: 'Crop name is required in market data' 
      });
    }

    const insights = await marketService.generateMarketInsights(marketData);
    
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Market insights error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
