import express from 'express';

import {
  dashboardReport,
  enrollmentReport,
  attendanceReport,
  gradesReport,
  riskStudentsReport,
  announcementsReport,
  exportEnrollmentReport,
  exportAttendanceDetailReport,
  exportGradesReport,
  exportRiskStudentsReport,
  exportAnnouncementsReport
} from '../controllers/reports.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/dashboard',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  dashboardReport
);

router.get(
  '/enrollments',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  enrollmentReport
);

router.get(
  '/enrollments/export',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  exportEnrollmentReport
);

router.get(
  '/attendance/export-detail',
  verifyToken,
  authorizeRoles('Director', 'Auxiliar'),
  exportAttendanceDetailReport
);

router.get(
  '/attendance',
  verifyToken,
  authorizeRoles('Director', 'Auxiliar'),
  attendanceReport
);

router.get(
  '/grades/export',
  verifyToken,
  authorizeRoles('Director'),
  exportGradesReport
);

router.get(
  '/grades',
  verifyToken,
  authorizeRoles('Director'),
  gradesReport
);

router.get(
  '/risk-students/export',
  verifyToken,
  authorizeRoles('Director', 'Auxiliar'),
  exportRiskStudentsReport
);

router.get(
  '/risk-students',
  verifyToken,
  authorizeRoles('Director', 'Auxiliar'),
  riskStudentsReport
);

router.get(
  '/announcements/export',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  exportAnnouncementsReport
);

router.get(
  '/announcements',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Auxiliar'),
  announcementsReport
);

export default router;