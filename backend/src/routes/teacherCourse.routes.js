import express from 'express';

import {
  getAllTeacherCourses,
  createNewTeacherCourse,
  getAssignmentsByTeacher,
  getAssignmentsByClassroom,
  deleteExistingTeacherCourse,
  getMyTeacherCourses,
  getMyTeacherStudents
} from '../controllers/teacherCourse.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllTeacherCourses
);

router.get(
  '/me',
  verifyToken,
  authorizeRoles('Docente'),
  getMyTeacherCourses
);

router.get(
  '/me/students',
  verifyToken,
  authorizeRoles('Docente'),
  getMyTeacherStudents
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createNewTeacherCourse
);

router.get(
  '/teacher/:teacherId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAssignmentsByTeacher
);

router.get(
  '/classroom/:classroomId',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getAssignmentsByClassroom
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  deleteExistingTeacherCourse
);

export default router;