import express, { NextFunction, Request, Response } from 'express';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middlewares/auth';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import validateRequest from '../../middlewares/validateRequest';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import { getSingleFilePath } from '../../../shared/getFilePath';
const router = express.Router();

router
  .route('/profile')
  .get(
    auth(
      USER_ROLES.ADMIN,
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
      USER_ROLES.EMPLOYEE,
      USER_ROLES.SUPER_ADMIN,
    ),
    UserController.getUserProfile,
  )
  .patch(
    auth(
      USER_ROLES.ADMIN,
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
      USER_ROLES.EMPLOYEE,
      USER_ROLES.SUPER_ADMIN,
    ),
    fileUploadHandler(),
    (req: Request, res: Response, next: NextFunction) => {
      if (req.body.data) {
        req.body = UserValidation.updateUserZodSchema.parse(
          JSON.parse(req.body.data),
        );
      }
      return UserController.updateProfile(req, res, next);
    },
  );

router
  .route('/register-role')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    UserController.createSubUserByOwner,
  );

router.post(
  '/create-employee',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  fileUploadHandler(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const image = getSingleFilePath(req.files, "image");
      if (image) {
        req.body.profileImage = image;
      }
      next();
    } catch (error) {
      next(error);
    }
  },
  UserController.createEmployee,
);

router
  .route('/sub-user')
  .get(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    UserController.getSubUsers,
  );

router.get(
  '/sub-user/:subUserId',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  UserController.getSubUserById,
);

router.get(
  '/business-owners',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.getBusinessOwners,
);
router.get(
  '/all-business-owners',
  auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
  UserController.getAllBusinessOwners,
);

router.get(
  '/business-owner/:id/institutions',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.getInstitutionsByOwnerId,
);

router
  .route('/sub-user/:subUserID')
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    UserController.updateSubUserById,
  )
  .delete(
    auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
    checkAccessFromRootSubscription,
    UserController.deleteSubUserById,
  );

router.patch(
  '/sub-user/:subUserID/status',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR),
  checkAccessFromRootSubscription,
  UserController.updateSubUserStatusById,
);

router.patch(
  '/status/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  UserController.updateStatusById,
);

router
  .route('/')
  .post(
    validateRequest(UserValidation.createUserZodSchema),
    UserController.createUser,
  );

export const UserRoutes = router;
