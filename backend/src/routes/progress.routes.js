import express from 'express';

import {
  getMyProgress,
  getProgressByStudentId
} from '../controllers/progress.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/me',
  verifyToken,
  authorizeRoles('Estudiante', 'Apoderado'),
  getMyProgress
);

router.get(
  '/student/:studentId',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Auxiliar',
    'Docente',
    'Estudiante',
    'Apoderado'
  ),
  getProgressByStudentId
);

export default router;