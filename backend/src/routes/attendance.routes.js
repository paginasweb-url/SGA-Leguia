import express from 'express';

import {
  getClassroomStudentsForAttendance,
  registerClassroomAttendance,
  getClassroomAttendanceByDate,
  getClassroomAttendanceByRange,
  getStudentAttendance,
  getClassroomAttendanceSummary,
  getAttendanceClassrooms,
  getMyAttendance,
  createAttendanceJustificationRequest,
  getAttendanceJustificationRequests,
  reviewAttendanceJustificationRequest,
  downloadAttendanceJustificationDocument,
  getAttendanceAlertRequests,
  resolveAttendanceAlertRequest
} from '../controllers/attendance.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

import { upload } from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get(
  '/classrooms',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  getAttendanceClassrooms
);

router.get(
  '/me',
  verifyToken,
  authorizeRoles('Docente', 'Estudiante', 'Apoderado'),
  getMyAttendance
);

router.post(
  '/justifications',
  verifyToken,
  authorizeRoles('Apoderado', 'Auxiliar'),
  upload.single('documento'),
  createAttendanceJustificationRequest
);

router.get(
  '/justifications',
  verifyToken,
  authorizeRoles('Apoderado', 'Auxiliar', 'Director', 'Administrativo'),
  getAttendanceJustificationRequests
);

router.patch(
  '/justifications/:id/review',
  verifyToken,
  authorizeRoles('Auxiliar', 'Director', 'Administrativo'),
  reviewAttendanceJustificationRequest
);

router.get(
  '/justifications/:id/download',
  verifyToken,
  authorizeRoles('Apoderado', 'Auxiliar', 'Director', 'Administrativo'),
  downloadAttendanceJustificationDocument
);

router.get(
  '/alerts',
  verifyToken,
  authorizeRoles('Auxiliar', 'Director', 'Administrativo'),
  getAttendanceAlertRequests
);

router.patch(
  '/alerts/:id/resolve',
  verifyToken,
  authorizeRoles('Auxiliar', 'Director', 'Administrativo'),
  resolveAttendanceAlertRequest
);

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
  '/classroom/:aulaId/range',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  getClassroomAttendanceByRange
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
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  getStudentAttendance
);

export default router;