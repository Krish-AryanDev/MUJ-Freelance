import { Router } from 'express';

import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/role.middleware.js';
import {
	banUser,
	getAnalytics,
	getDashboardStats,
	getDisputes,
	getOrders,
	getUsers,
	resolveDispute,
	unbanUser,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/dashboard-stats', getDashboardStats);

router.get('/users', getUsers);
router.put('/users/:id/ban', banUser);
router.put('/users/:id/unban', unbanUser);

router.get('/orders', getOrders);
router.get('/disputes', getDisputes);
router.put('/orders/:id/resolve-dispute', resolveDispute);

router.get('/analytics', getAnalytics);

export default router;

