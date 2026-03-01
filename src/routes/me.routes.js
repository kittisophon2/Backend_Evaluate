import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';
import upload from '../middlewares/upload.middleware.js';

import * as evaluation from '../controllers/me/evaluation.controller.js';
import * as evidence from '../controllers/me/evidence.controller.js';

const router = Router();

router.use(auth, role('EVALUATEE'));

router.get('/evaluation', evaluation.myEvaluation);
router.post('/evidence', upload.single('file'), evidence.upload);
router.get('/evidence', evidence.list);
router.delete('/evidence/:id', evidence.remove);

export default router;
