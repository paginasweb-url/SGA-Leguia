import express from 'express';

import {
  createGuardianStudentLink,
  getStudentGuardians,
  getGuardianStudents,
  deleteGuardianStudentLink
} from '../controllers/guardianStudent.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createGuardianStudentLink
);

router.get(
  '/student/:studentId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getStudentGuardians
);

router.get(
  '/guardian/:guardianId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Apoderado'),
  getGuardianStudents
);

router.delete(
  '/:relationId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  deleteGuardianStudentLink
);

export default router;