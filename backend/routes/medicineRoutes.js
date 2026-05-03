import express from 'express';
import { searchMedicines, voiceMatchMedicines, addMedicine } from '../controllers/medicineController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', authenticateToken, searchMedicines);
router.post('/voice-match', authenticateToken, voiceMatchMedicines);
router.post('/add', authenticateToken, addMedicine);

export default router;
