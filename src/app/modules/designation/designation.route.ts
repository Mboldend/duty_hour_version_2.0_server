import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { DesignationControllers } from './designation.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { DesignationValidation } from './designation.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    validateRequest(DesignationValidation.createDesignationValidationSchema),
    checkAccessFromRootSubscription,
    DesignationControllers.createDesignation,
  )
  .get(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    DesignationControllers.getAllDesignation,
  );

router
  .route('/:designationID')
  .get(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    DesignationControllers.getDesignationById,
  )
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    DesignationControllers.updateDesignationById,
  )
  .delete(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    DesignationControllers.deleteDesignationById,
  );

router.patch(
  '/:designationID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  DesignationControllers.updateDesignationStatusById,
);

export const DesignationRoutes = router;
