import express from 'express';

import {
  requestPasswordRecovery,
  listPasswordRecoveryRequests,
  getPasswordRecoveryRequestDetail,
  approveRecoveryRequest,
  rejectRecoveryRequest,
  manualPasswordReset
} from '../controllers/passwordRecovery.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/request',
  requestPasswordRecovery
);

router.get(
  '/requests',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  listPasswordRecoveryRequests
);

router.get(
  '/requests/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getPasswordRecoveryRequestDetail
);

router.patch(
  '/requests/:id/approve',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  approveRecoveryRequest
);

router.patch(
  '/requests/:id/reject',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  rejectRecoveryRequest
);

router.patch(
  '/users/:userId/reset',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  manualPasswordReset
);

export default router;