import express from 'express';

import {
  getReinforcementsRequest,
  getReinforcementByIdRequest,
  getReinforcementCandidatesRequest,
  getAvailableTeachersRequest,
  getAvailableClassroomsRequest,
  createReinforcementRequest,
  updateReinforcementRequest,
  cancelReinforcementRequest,
  completeReinforcementRequest,
  respondReinforcementStudentRequest,
  saveReinforcementAttendanceRequest
} from '../controllers/reinforcement.controller.js';

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
  getReinforcementsRequest
);

router.get(
  '/candidates',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getReinforcementCandidatesRequest
);

router.get(
  '/available-teachers',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAvailableTeachersRequest
);

router.get(
  '/available-classrooms',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  getAvailableClassroomsRequest
);

router.post(
  '/',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  createReinforcementRequest
);

router.patch(
  '/assignments/:id/respond',
  verifyToken,
  authorizeRoles('Apoderado'),
  respondReinforcementStudentRequest
);

router.get(
  '/:id',
  verifyToken,
  authorizeRoles(
    'Director',
    'Administrativo',
    'Docente',
    'Auxiliar',
    'Estudiante',
    'Apoderado'
  ),
  getReinforcementByIdRequest
);

router.put(
  '/:id',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  updateReinforcementRequest
);

router.patch(
  '/:id/cancel',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  cancelReinforcementRequest
);

router.patch(
  '/:id/complete',
  verifyToken,
  authorizeRoles('Director', 'Administrativo'),
  completeReinforcementRequest
);

router.put(
  '/:id/attendance',
  verifyToken,
  authorizeRoles('Auxiliar'),
  saveReinforcementAttendanceRequest
);

export default router;