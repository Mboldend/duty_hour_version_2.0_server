import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { InstitutionControllers } from './institution.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { InstitutionValidation } from './institution.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER),
    fileUploadHandler(),
    validateRequest(InstitutionValidation.createInstitutionValidationSchema),
    checkAccessFromRootSubscription,
    InstitutionControllers.createInstitution,
  )
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    InstitutionControllers.getInstitution,
  );

router.get(
  '/admin/:institutionID',
  auth(USER_ROLES.SUPER_ADMIN),
  InstitutionControllers.getInstitutionByIdForSuperAdmin,
);

router
  .route('/:institutionID')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    InstitutionControllers.getInstitutionById,
  )
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER),
    fileUploadHandler(),
    checkAccessFromRootSubscription,
    InstitutionControllers.updateInstitutionById,
  )
  .delete(
    auth(USER_ROLES.BUSINESS_OWNER),
    checkAccessFromRootSubscription,
    InstitutionControllers.deleteInstitutionById,
  );

router.patch(
  '/:institutionID/status',
  auth(USER_ROLES.BUSINESS_OWNER),
  checkAccessFromRootSubscription,
  InstitutionControllers.updateInstitutionStatusById,
);

router.patch(
  '/admin/:institutionID/status',
  auth(USER_ROLES.SUPER_ADMIN),
  InstitutionControllers.updateInstitutionStatusByIdForSuperAdmin,
);

export const InstitutionRoutes = router;
