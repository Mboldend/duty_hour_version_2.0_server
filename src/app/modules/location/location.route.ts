import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { LocationControllers } from './location.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { LocationValidation } from './location.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    validateRequest(LocationValidation.createLocationValidationSchema),
    checkAccessFromRootSubscription,
    LocationControllers.createLocation,
  )
  .get(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    LocationControllers.getAllLocation,
  );

router
  .route('/:locationID')
  .get(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    LocationControllers.getLocationById,
  )
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    LocationControllers.updateLocationById,
  )
  .delete(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    LocationControllers.deleteLocationById,
  );

router.patch(
  '/:locationID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  LocationControllers.updateLocationStatusById,
);

export const LocationRoutes = router;
