import express from 'express';

import {
  getAllStudents,
  createNewStudent,
  getStudent,
  updateExistingStudent,
  deactivateExistingStudent
} from '../controllers/students.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllStudents
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewStudent
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getStudent
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingStudent
);

router.patch(
  '/:id/deactivate',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  deactivateExistingStudent
);

export default router;