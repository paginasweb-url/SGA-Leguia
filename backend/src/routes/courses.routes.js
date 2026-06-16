import express from 'express';

import {
  getAllCourses,
  getCourse,
  createNewCourse,
  updateExistingCourse,
  deleteExistingCourse,
  getMyCourses
} from '../controllers/courses.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getAllCourses
);

router.get(
  '/me',
  verifyToken,
  authorizeRoles('Estudiante'),
  getMyCourses
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getCourse
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewCourse
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingCourse
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Director'),
  deleteExistingCourse
);

export default router;