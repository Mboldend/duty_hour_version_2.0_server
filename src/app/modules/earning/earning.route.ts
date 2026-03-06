import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { EarningControllers } from './earning.controller';

const router = express.Router();

router.get(
  '/',
  auth(USER_ROLES.SUPER_ADMIN),
  EarningControllers.getTotalEarnings,
);

export const EarningRoutes = router;
