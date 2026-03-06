import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { ShiftControllers } from './shift.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { ShiftValidation } from './shift.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    validateRequest(ShiftValidation.createShiftValidationSchema),
    checkAccessFromRootSubscription,
    ShiftControllers.createShift,
  )
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
      USER_ROLES.EMPLOYEE,
    ),
    checkAccessFromRootSubscription,
    ShiftControllers.getShifts,
  );

router
  .route('/:shiftID')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    ShiftControllers.getShiftById,
  )
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    ShiftControllers.updateShiftById,
  )
  .delete(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    ShiftControllers.deleteShiftById,
  );

router.patch(
  '/:shiftID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  ShiftControllers.updateShiftStatusById,
);

export const ShiftRoutes = router;
