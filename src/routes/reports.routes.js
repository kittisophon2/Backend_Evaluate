import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import * as reports from '../controllers/reports.controller.js';

const router = Router();

router.use(auth);

router.get('/normalized', reports.normalized);
router.get('/progress', reports.progress);

export default router;
