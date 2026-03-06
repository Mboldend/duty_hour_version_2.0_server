import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AssignShiftControllers } from './assignShift.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';

const router = express.Router();

router
  .route('/')
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    AssignShiftControllers.createAssignShiftToDB,
  );
router.patch(
  '/update',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  AssignShiftControllers.updateAssignedShift,
);

export const AssignShiftRoutes = router;
