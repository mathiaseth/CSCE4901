import express from 'express';
import { getFoodByBarcode } from '../controllers/foodController.js';

const router = express.Router();

// GET /api/food/:barcode
router.get('/:barcode', getFoodByBarcode);

export default router;

