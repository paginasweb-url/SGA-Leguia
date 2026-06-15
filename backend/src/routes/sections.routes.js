import express from 'express';

import {
  getAllSections,
  getSection,
  createNewSection,
  updateExistingSection,
  deleteExistingSection
} from '../controllers/sections.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllSections
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getSection
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewSection
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingSection
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Director'),
  deleteExistingSection
);

export default router;