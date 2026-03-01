import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';

import * as assignments from '../controllers/evaluator/assignments.controller.js';
import * as results from '../controllers/evaluator/results.controller.js';

const router = Router();

router.use(auth, role('EVALUATOR'));

router.get('/assignments', assignments.list);
router.get('/assignments/:id', assignments.detail);
router.put('/assignments/:id/results', results.save);
router.patch('/assignments/:id/submit', results.submit);

export default router;
