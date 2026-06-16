import express from 'express';

import {
  getMySettings,
  updateMyPreferences
} from '../controllers/settings.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/me',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Auxiliar',
    'Docente',
    'Estudiante',
    'Apoderado'
  ),
  getMySettings
);

router.patch(
  '/me/preferences',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Auxiliar',
    'Docente',
    'Estudiante',
    'Apoderado'
  ),
  updateMyPreferences
);

export default router;