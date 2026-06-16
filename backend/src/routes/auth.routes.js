import express from 'express';

import {
  login,
  changePassword,
  accessHistory
} from '../controllers/auth.controller.js';

import { verifyToken,authorizeRoles} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/login', login);

router.patch('/change-password', verifyToken, changePassword);

router.get(
  '/access-history',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  accessHistory
);

export default router;