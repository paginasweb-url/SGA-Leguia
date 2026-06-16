import express from 'express';

import {
  createNewAnnouncement,
  getAllAnnouncements,
  getAnnouncement,
  getMyAnnouncements,
  markAnnouncementAsRead,
  getReadSummary
} from '../controllers/announcements.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  createNewAnnouncement
);

router.get(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAllAnnouncements
);

router.get(
  '/my',
  verifyToken,
  getMyAnnouncements
);

router.get(
  '/:id',
  verifyToken,
  getAnnouncement
);

router.patch(
  '/:id/read',
  verifyToken,
  markAnnouncementAsRead
);

router.get(
  '/:id/summary',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getReadSummary
);

export default router;