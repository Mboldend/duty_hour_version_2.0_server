import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { HolidayControllers } from './holiday.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { HolidayValidation } from './holiday.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    validateRequest(HolidayValidation.createHolidayValidationSchema),
    checkAccessFromRootSubscription,
    HolidayControllers.createHoliday,
  )
  .get(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    HolidayControllers.getHolidays,
  );

router
  .route('/:holidayID')
  .get(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    HolidayControllers.getHolidayById,
  )
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    HolidayControllers.updateHolidayById,
  )
  .delete(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    HolidayControllers.deleteHolidayById,
  );

router.patch(
  '/:holidayID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  HolidayControllers.updateHolidayStatusById,
);

export const HolidayRoutes = router;
