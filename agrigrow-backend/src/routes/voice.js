import express from 'express';

const router = express.Router();

// POST /api/voice/transcribe
router.post('/transcribe', async (req, res) => {
  try {
    // Controller will be implemented here
    res.json({ message: 'Voice transcription endpoint - to be implemented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/voice/get-response
router.post('/get-response', async (req, res) => {
  try {
    // Controller will be implemented here
    res.json({ message: 'Voice response endpoint - to be implemented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
