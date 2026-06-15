import express from 'express';

import {
  getAllTeacherCourses,
  createNewTeacherCourse,
  getAssignmentsByTeacher,
  getAssignmentsByClassroom,
  deleteExistingTeacherCourse
} from '../controllers/teacherCourse.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  getAllTeacherCourses
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
  authorizeRoles('Director', 'Administrativo', 'Docente'),
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