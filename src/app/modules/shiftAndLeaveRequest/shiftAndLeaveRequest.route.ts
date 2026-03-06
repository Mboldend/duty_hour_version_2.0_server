import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { ShiftAndLeaveRequestControllers } from './shiftAndLeaveRequest.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { ShiftAndLeaveRequestValidation } from './shiftAndLeaveRequest.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.EMPLOYEE),
    validateRequest(
      ShiftAndLeaveRequestValidation.createShiftAndLeaveRequestSchema,
    ),
    checkAccessFromRootSubscription,
    ShiftAndLeaveRequestControllers.createShiftAndLeaveRequest,
  )
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    ShiftAndLeaveRequestControllers.getShiftAndLeaveRequests,
  );

router.get(
  '/shift/me',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  ShiftAndLeaveRequestControllers.getOwnShiftRequests,
);

router.get(
  '/leave/me',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  ShiftAndLeaveRequestControllers.getOwnLeaveRequests,
);

router
  .route('/:shiftAndLeaveRequestID')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    ShiftAndLeaveRequestControllers.getShiftAndLeaveRequestById,
  );

router.patch(
  '/:shiftAndLeaveRequestID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  ShiftAndLeaveRequestControllers.updateShiftAndLeaveRequestStatusById,
);

router.patch(
  '/bulk-update-status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  ShiftAndLeaveRequestControllers.updateMultipleShiftAndLeaveRequestStatuses,
);

export const ShiftAndLeaveRequestRoutes = router;
