import express from 'express';
import multer from 'multer';

import {
  uploadEnrollmentFormat,
  listEnrollmentFormats,
  listPublicEnrollmentFormats,
  getEnrollmentFormatDetail,
  updateEnrollmentFormatData,
  updateEnrollmentFormatStatusData,
  downloadEnrollmentFormat
} from '../controllers/enrollmentFormats.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.get(
  '/public',
  listPublicEnrollmentFormats
);

router.get(
  '/:id/download',
  downloadEnrollmentFormat
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  upload.single('archivo'),
  uploadEnrollmentFormat
);

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  listEnrollmentFormats
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getEnrollmentFormatDetail
);

router.patch(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateEnrollmentFormatData
);

router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateEnrollmentFormatStatusData
);

export default router;