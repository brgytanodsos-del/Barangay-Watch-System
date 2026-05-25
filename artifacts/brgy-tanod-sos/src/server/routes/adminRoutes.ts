import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { adminCreateUserSchema } from '../validators/authValidator';
import { strictRateLimiter } from '../middleware/rateLimiter';
import * as adminController from '../controllers/adminController';
import { pool } from '../db/index';
import * as response from '../utils/response';

const router = Router();

// All admin routes require authentication + admin/superadmin role
router.use(authenticate);
router.use(authorize(['admin', 'superadmin']));

// POST /api/admin/users — create any role including admin
router.post(
  '/users',
  strictRateLimiter,
  validate(adminCreateUserSchema),
  adminController.createUser
);

// GET /api/admin/users — list all users
router.get('/users', adminController.listUsers);

// PATCH /api/admin/users/:id/role — change a user's role
router.patch('/users/:id/role', adminController.updateUserRole);

// PATCH /api/admin/users/:id/status — verify, suspend, etc.
router.patch('/users/:id/status', adminController.updateUserStatus);

// DELETE /api/admin/users/:id — remove a user
router.delete('/users/:id', adminController.deleteUser);

// GET /api/admin/audit-logs — list audit logs
router.get('/audit-logs', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 200);
    const result = await pool.query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return response.success(res, result.rows);
  } catch (err: any) {
    console.error('[Admin] audit-logs error:', err.message);
    return response.error(res, 'Failed to fetch audit logs.');
  }
});

export default router;
