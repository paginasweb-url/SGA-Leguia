import express from 'express';

import {
  getMyNotifications,
  markMyNotificationAsRead
} from '../controllers/notifications.controller.js';

import {
  verifyToken
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/me',
  verifyToken,
  getMyNotifications
);

router.patch(
  '/:id/read',
  verifyToken,
  markMyNotificationAsRead
);

export default router;