import express from 'express';

import {
  getAllAcademicPeriods,
  getAcademicPeriod,
  createNewAcademicPeriod,
  updateExistingAcademicPeriod,
  activateExistingAcademicPeriod
} from '../controllers/academicPeriods.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllAcademicPeriods
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAcademicPeriod
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewAcademicPeriod
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingAcademicPeriod
);

router.patch(
  '/:id/activate',
  verifyToken,
  authorizeRoles('Director'),
  activateExistingAcademicPeriod
);

export default router;