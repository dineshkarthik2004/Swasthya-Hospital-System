import express from 'express';
import { searchMedicines, voiceMatchMedicines, addMedicine, uploadMedicines, upload } from '../controllers/medicineController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/search', authenticateToken, searchMedicines);
router.post('/voice-match', authenticateToken, voiceMatchMedicines);
router.post('/add', authenticateToken, addMedicine);
router.post('/upload', authenticateToken, upload.single('file'), uploadMedicines);

export default router;
