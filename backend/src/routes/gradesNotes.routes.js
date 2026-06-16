import express from 'express';

import {
  getClassroomStudentsForGrades,
  registerGrades,
  getClassroomCourseGrades,
  getStudentGrades,
  getClassroomCourseSummary,
  getRiskStudents,
  getMyGrades
} from '../controllers/gradesNotes.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/classroom/:aulaId/students',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getClassroomStudentsForGrades
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Docente'),
  registerGrades
);

router.get(
  '/classroom/:aulaId/course/:cursoId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getClassroomCourseGrades
);

router.get(
  '/classroom/:aulaId/course/:cursoId/bimester/:bimestre',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getClassroomCourseGrades
);

router.get(
  '/classroom/:aulaId/course/:cursoId/summary',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getClassroomCourseSummary
);

router.get(
  '/classroom/:aulaId/risk',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getRiskStudents
);

router.get(
  '/me',
  verifyToken,
  authorizeRoles('Estudiante', 'Apoderado'),
  getMyGrades
);

router.get(
  '/student/:studentId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente', 'Estudiante', 'Apoderado'),
  getStudentGrades
);

export default router;