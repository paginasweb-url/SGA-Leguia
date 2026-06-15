import express from 'express';

import {
  dashboardReport,
  enrollmentReport,
  attendanceReport,
  gradesReport,
  riskStudentsReport,
  announcementsReport,
  exportAttendanceDetailReport
} from '../controllers/reports.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/dashboard', verifyToken, authorizeRoles('Director', 'Administrativo'), dashboardReport);
router.get('/enrollments', verifyToken, authorizeRoles('Director', 'Administrativo'), enrollmentReport);
router.get('/attendance/export-detail',verifyToken,authorizeRoles('Director', 'Administrativo'),exportAttendanceDetailReport);
router.get('/attendance', verifyToken, authorizeRoles('Director', 'Administrativo'), attendanceReport);
router.get('/grades', verifyToken, authorizeRoles('Director', 'Administrativo'), gradesReport);
router.get('/risk-students', verifyToken, authorizeRoles('Director', 'Administrativo'), riskStudentsReport);
router.get('/announcements', verifyToken, authorizeRoles('Director', 'Administrativo'), announcementsReport);

export default router;