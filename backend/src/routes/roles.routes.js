import express from 'express';

import { listRoles } from '../controllers/roles.controller.js';
import { verifyToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', verifyToken, listRoles);

export default router;