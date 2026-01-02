import express from 'express';
import { processVoiceQuery, getCropAdvice, detectIntent } from '../services/voiceService.js';

const router = express.Router();

// POST /api/voice/process - Process voice transcript and get AI response
router.post('/process', async (req, res) => {
  try {
    const { transcript, language } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transcript is required' 
      });
    }

    const response = await processVoiceQuery(transcript, language || 'en');
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Voice process error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/voice/crop-advice - Get specific crop advice
router.post('/crop-advice', async (req, res) => {
  try {
    const { cropName, issue } = req.body;
    
    if (!cropName || !issue) {
      return res.status(400).json({ 
        success: false, 
        error: 'Crop name and issue are required' 
      });
    }

    const advice = await getCropAdvice(cropName, issue);
    
    res.json({
      success: true,
      data: advice
    });
  } catch (error) {
    console.error('Crop advice error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/voice/detect-intent - Detect intent from transcript
router.post('/detect-intent', async (req, res) => {
  try {
    const { transcript } = req.body;
    
    if (!transcript) {
      return res.status(400).json({ 
        success: false, 
        error: 'Transcript is required' 
      });
    }

    const intent = await detectIntent(transcript);
    
    res.json({
      success: true,
      data: intent
    });
  } catch (error) {
    console.error('Intent detection error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
