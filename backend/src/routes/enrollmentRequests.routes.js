import express from 'express';

import {
  createNewEnrollmentRequest,
  getAllEnrollmentRequests,
  getEnrollmentRequest,
  uploadDocumentToEnrollmentRequest,
  getEnrollmentRequestDocuments,
  updateRequestStatus,
  trackRequestStatus
} from '../controllers/enrollmentRequests.controller.js';

import { upload } from '../middlewares/upload.middleware.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', createNewEnrollmentRequest);

router.post('/track', trackRequestStatus);

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllEnrollmentRequests
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getEnrollmentRequest
);

router.post(
  '/:id/documents',
  upload.single('documento'),
  uploadDocumentToEnrollmentRequest
);

router.get(
  '/:id/documents',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getEnrollmentRequestDocuments
);

router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo'
  ),
  updateRequestStatus
);

export default router;