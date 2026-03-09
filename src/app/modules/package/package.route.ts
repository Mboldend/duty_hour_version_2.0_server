import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { PackageControllers } from './package.controller';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.SUPER_ADMIN),
    // validateRequest(PackageValidation.createPackageSchemaValidation),
    PackageControllers.createPackage,
  )
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.BUSINESS_OWNER),
    PackageControllers.getPackages,
  );

router.get(
  '/active-package',
  auth(USER_ROLES.BUSINESS_OWNER),
  PackageControllers.getActivePackage,
);

router
  .route('/:id')
  .get(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.BUSINESS_OWNER),
    PackageControllers.getPackageById,
  )

  .delete(auth(USER_ROLES.SUPER_ADMIN), PackageControllers.deletePackageById);

export const PackageRoutes = router;
