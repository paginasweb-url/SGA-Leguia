import express from 'express';

import {
  getCalendarEventsRequest,
  getCalendarClassroomsRequest,
  createCalendarEventRequest,
  updateCalendarEventRequest,
  cancelCalendarEventRequest
} from '../controllers/calendar.controller.js';

import {
  verifyToken,
  authorizeRoles
} from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get(
  '/',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Docente',
    'Auxiliar',
    'Estudiante',
    'Apoderado'
  ),
  getCalendarEventsRequest
);

router.get(
  '/classrooms',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Docente',
    'Auxiliar',
    'Estudiante',
    'Apoderado'
  ),
  getCalendarClassroomsRequest
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  createCalendarEventRequest
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  updateCalendarEventRequest
);

router.patch(
  '/:id/cancel',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  cancelCalendarEventRequest
);

router.delete(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo', 'Docente'),
  cancelCalendarEventRequest
);

export default router;