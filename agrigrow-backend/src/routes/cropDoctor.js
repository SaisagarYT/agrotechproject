import express from 'express';
import multer from 'multer';
import { cropDoctorImageToText, cropDoctorTextGeneration } from '../controllers/cropDoctorController.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.post('/analyze-image', upload.single('image'), cropDoctorImageToText);
router.post('/get-treatment', cropDoctorTextGeneration);

// GET /api/crop-doctor/history/:farmerId
router.get('/history/:farmerId', async (req, res) => {
  try {
    // Controller will be implemented here
    res.json({ message: 'History retrieval endpoint - to be implemented' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
