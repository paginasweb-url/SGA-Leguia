import express from 'express';

import {
  getAllUsers,
  createNewUser,
  getUser,
  updateExistingUser,
  deactivateExistingUser
} from '../controllers/users.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllUsers
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getUser
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director'),
  createNewUser
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingUser
);

router.patch(
  '/:id/deactivate',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  deactivateExistingUser
);

export default router;