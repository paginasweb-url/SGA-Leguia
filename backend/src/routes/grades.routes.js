import express from 'express';

import {
  getAllGrades,
  getGrade,
  createNewGrade,
  updateExistingGrade,
  deleteExistingGrade
} from '../controllers/grades.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllGrades
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getGrade
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewGrade
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingGrade
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Director'),
  deleteExistingGrade
);

export default router;