import express from 'express';
import { searchMedicines, voiceMatchMedicines } from '../controllers/medicineController.js';

const router = express.Router();

// Existing manual search route (unchanged)
router.get('/search', searchMedicines);

// NEW: Voice medicine matching route
router.post('/voice-match', voiceMatchMedicines);

export default router;
