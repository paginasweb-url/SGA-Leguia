import express from 'express';

import {
  getAllSchedules,
  getSchedule,
  createNewSchedule,
  updateExistingSchedule,
  deleteExistingSchedule,
  getClassroomSchedules,
  getTeacherSchedules
} from '../controllers/schedules.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente', 'Estudiante', 'Apoderado'),
  getAllSchedules
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

router.get(
  '/classroom/:classroomId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente', 'Estudiante', 'Apoderado'),
  getClassroomSchedules
);

router.get(
  '/teacher/:teacherId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getTeacherSchedules
);

export default router;