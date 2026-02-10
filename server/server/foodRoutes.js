import express from 'express';
import { getFoodInfo } from '../controllers/foodController.js';

const router = express.Router();

// Route to get nutrition info by barcode or product name
router.get('/:barcode', getFoodInfo);

export default router;
