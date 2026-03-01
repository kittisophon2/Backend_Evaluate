import { Router } from 'express';
import auth from '../middlewares/auth.middleware.js';
import role from '../middlewares/role.middleware.js';

import * as users from '../controllers/admin/users.controller.js';
import * as topics from '../controllers/admin/topics.controller.js';
import * as indicators from '../controllers/admin/indicators.controller.js';
import * as periods from '../controllers/admin/periods.controller.js';
import * as assignments from '../controllers/admin/assignments.controller.js';

const router = Router();

router.use(auth, role('ADMIN'));

// Users
router.get('/users', users.list);
router.post('/users', users.create);
router.get('/users/:id', users.get);
router.patch('/users/:id', users.update);
router.delete('/users/:id', users.remove);


// Topics & Indicators
router.get('/topics', topics.list);
router.post('/topics', topics.create);
router.patch('/topics/:id', topics.update);
router.delete('/topics/:id', topics.remove);

router.post('/topics/:topicId/indicators', indicators.create);
router.patch('/topics/:topicId/indicators/:indicatorId', indicators.update);
router.delete('/topics/:topicId/indicators/:indicatorId', indicators.remove);

// Periods
router.get('/periods', periods.list);
router.post('/periods', periods.create);
router.patch('/periods/:id', periods.update);
router.patch('/periods/:id/close', periods.close);

// Assignments
router.get('/assignments', assignments.list);
router.post('/assignments', assignments.create);
router.patch('/assignments/:id', assignments.update);
router.delete('/assignments/:id', assignments.remove);


export default router;
