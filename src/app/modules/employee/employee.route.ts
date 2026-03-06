import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { EmployeeControllers } from './employee.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';

const router = express.Router();

router
  .route('/')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    EmployeeControllers.getEmployees,
  );

router
  .route('/:employeeID')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    EmployeeControllers.getEmployeeById,
  )
  .patch(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    fileUploadHandler(),
    EmployeeControllers.updateEmployeeById,
  )
  .delete(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    EmployeeControllers.deleteEmployeeById,
  );

router.patch(
  '/:employeeID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  EmployeeControllers.updateEmployeeStatusById,
);

export const EmployeeRoutes = router;
