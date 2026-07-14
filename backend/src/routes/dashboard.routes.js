import express from 'express';

import {
  getStats,
  getTeacherDashboard,
  getAuxiliaryDashboard,
  getDirectorDashboard
} from '../controllers/dashboard.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/stats',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getStats
);

router.get(
  '/director',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getDirectorDashboard
);

router.get(
  '/teacher',
  verifyToken,
  authorizeRoles('Docente'),
  getTeacherDashboard
);

router.get(
  '/auxiliary',
  verifyToken,
  authorizeRoles('Auxiliar'),
  getAuxiliaryDashboard
);

export default router;