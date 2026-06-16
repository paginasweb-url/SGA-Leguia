import express from 'express';

import {
  getAllSchedules,
  getSchedule,
  createNewSchedule,
  updateExistingSchedule,
  deleteExistingSchedule,
  getClassroomSchedules,
  getTeacherSchedules,
  getMySchedules
} from '../controllers/schedules.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllSchedules
);

router.get(
  '/me',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente', 'Estudiante', 'Apoderado'),
  getMySchedules
);

router.get(
  '/classroom/:classroomId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getClassroomSchedules
);

router.get(
  '/teacher/:teacherId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getTeacherSchedules
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getSchedule
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewSchedule
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateExistingSchedule
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Director'),
  deleteExistingSchedule
);

export default router;