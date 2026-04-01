import express from 'express';
import { searchMedicines } from '../controllers/medicineController.js';

const router = express.Router();

router.get('/search', searchMedicines);

export default router;
