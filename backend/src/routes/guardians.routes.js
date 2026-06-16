import express from 'express';

import {
  getAllGuardians,
  getGuardian,
  createNewGuardian,
  updateExistingGuardian,
  deactivateExistingGuardian
} from '../controllers/guardians.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllGuardians
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getGuardian
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewGuardian
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingGuardian
);

router.patch(
  '/:id/deactivate',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  deactivateExistingGuardian
);

export default router;