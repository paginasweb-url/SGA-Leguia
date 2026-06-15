import express from 'express';

import {
  getClassroomStudentsForAttendance,
  registerClassroomAttendance,
  getClassroomAttendanceByDate,
  getStudentAttendance,
  getClassroomAttendanceSummary
} from '../controllers/attendance.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/classroom/:aulaId/students',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  getClassroomStudentsForAttendance
);

router.post(
  '/classroom',
  verifyToken,
  authorizeRoles('Auxiliar'),
  registerClassroomAttendance
);

router.get(
  '/classroom/:aulaId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  getClassroomAttendanceByDate
);

router.get(
  '/classroom/:aulaId/summary',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  getClassroomAttendanceSummary
);

router.get(
  '/student/:studentId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar', 'Estudiante', 'Apoderado'),
  getStudentAttendance
);

export default router;