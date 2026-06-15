import express from 'express';

import {
  getAllClassrooms,
  getClassroom,
  createNewClassroom,
  updateExistingClassroom,
  deleteExistingClassroom
} from '../controllers/classrooms.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllClassrooms
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getClassroom
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewClassroom
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingClassroom
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Director'),
  deleteExistingClassroom
);

export default router;