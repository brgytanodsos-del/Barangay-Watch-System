import { Router } from 'express';
import * as authController from '../controllers/authController';
import { validate } from '../middleware/validate';
import { loginSchema, registerSchema } from '../validators/authValidator';
import { authenticate } from '../middleware/auth';
import { pool } from '../db/index';
import * as response from '../utils/response';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login',    validate(loginSchema),    authController.login);
router.post('/logout',                             authController.logout);

// FIXED: /me is now protected — unauthenticated requests get 401 automatically
router.get('/me', authenticate, authController.me);

// GET user by ID — used by frontend authService.getProfile(id)
router.get('/users/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role, status, created_at, last_active FROM users WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return response.error(res, 'User not found', 'NOT_FOUND', 404);
    }
    return response.success(res, result.rows[0]);
  } catch (err: any) {
    return response.error(res, 'Failed to fetch user profile.');
  }
});

export default router;
