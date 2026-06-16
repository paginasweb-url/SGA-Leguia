import express from 'express';

import {
  getStudentAnnualResult,
  getClassroomAnnualResults,
  getClassroomAnnualSummary,
  getMyAnnualResult
} from '../controllers/annualResults.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

  router.get(
    '/me',
    verifyToken,
    authorizeRoles('Estudiante', 'Apoderado'),
    getMyAnnualResult
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
  getStudentAnnualResult
);

router.get(
  '/classroom/:aulaId',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Auxiliar',
    'Docente'
  ),
  getClassroomAnnualResults
);

router.get(
  '/classroom/:aulaId/summary',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Auxiliar',
    'Docente'
  ),
  getClassroomAnnualSummary
);

export default router;