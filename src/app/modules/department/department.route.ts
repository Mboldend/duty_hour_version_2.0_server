import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { DepartmentControllers } from './department.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { DepartmentValidation } from './department.validation';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    validateRequest(DepartmentValidation.createDepartmentValidationSchema),
    checkAccessFromRootSubscription,
    DepartmentControllers.createDepartment,
  )
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    DepartmentControllers.getDepartments,
  );

router
  .route('/:departmentID')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    DepartmentControllers.getDepartmentById,
  )
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    DepartmentControllers.updateDepartmentById,
  )
  .delete(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    DepartmentControllers.deleteDepartmentById,
  );

router.patch(
  '/:departmentID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  DepartmentControllers.updateDepartmentStatusById,
);

export const DepartmentRoutes = router;
