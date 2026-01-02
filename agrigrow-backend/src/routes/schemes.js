import express from 'express';
import { 
  findEligibleSchemes, 
  getAllSchemes, 
  getSchemeById, 
  analyzeEligibility,
  addScheme,
  searchSchemes 
} from '../services/schemeService.js';

const router = express.Router();

// POST /api/schemes/find-eligible - Find schemes for farmer profile
router.post('/find-eligible', async (req, res) => {
  try {
    const { landSize, region, crops, farmerType, income } = req.body;
    
    if (!landSize && !region && !crops) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one filter (landSize, region, or crops) is required' 
      });
    }

    const farmerProfile = { landSize, region, crops, farmerType, income };
    const schemes = await findEligibleSchemes(farmerProfile);
    
    res.json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    console.error('Find eligible schemes error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/schemes/all - Get all schemes
router.get('/all', async (req, res) => {
  try {
    const { category } = req.query;
    const schemes = await getAllSchemes({ category });
    
    res.json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    console.error('Get all schemes error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/schemes/search - Search schemes by keyword
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query (q) is required' 
      });
    }

    const schemes = await searchSchemes(q);
    
    res.json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    console.error('Search schemes error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/schemes/:schemeId - Get scheme details
router.get('/:schemeId', async (req, res) => {
  try {
    const { schemeId } = req.params;
    const scheme = await getSchemeById(schemeId);
    
    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    console.error('Get scheme error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/schemes/:schemeId/analyze - Analyze eligibility for specific scheme
router.post('/:schemeId/analyze', async (req, res) => {
  try {
    const { schemeId } = req.params;
    const farmerProfile = req.body;
    
    const scheme = await getSchemeById(schemeId);
    const analysis = await analyzeEligibility(scheme, farmerProfile);
    
    res.json({
      success: true,
      scheme: scheme.name,
      data: analysis
    });
  } catch (error) {
    console.error('Analyze eligibility error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/schemes - Add new scheme (admin)
router.post('/', async (req, res) => {
  try {
    const schemeData = req.body;
    
    if (!schemeData.name || !schemeData.description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and description are required' 
      });
    }

    const scheme = await addScheme(schemeData);
    
    res.status(201).json({
      success: true,
      data: scheme
    });
  } catch (error) {
    console.error('Add scheme error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router;
