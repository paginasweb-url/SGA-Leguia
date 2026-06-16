import express from 'express';

import {
  getAllTeachers,
  getTeacher,
  createNewTeacher,
  updateExistingTeacher,
  deactivateExistingTeacher
} from '../controllers/teachers.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllTeachers
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getTeacher
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewTeacher
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingTeacher
);

router.patch(
  '/:id/deactivate',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  deactivateExistingTeacher
);

export default router;