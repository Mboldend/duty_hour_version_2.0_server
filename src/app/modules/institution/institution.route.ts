import express, { NextFunction, Response } from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { InstitutionControllers } from './institution.controller';
import fileUploadHandler from '../../middlewares/fileUploadHandler';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';
import validateRequest from '../../middlewares/validateRequest';
import { InstitutionValidation } from './institution.validation';
import { getSingleFilePath } from '../../../shared/getFilePath';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

router
  .route('/')
  .post(
    auth(USER_ROLES.BUSINESS_OWNER),
    fileUploadHandler(),
    async (req, res, next) => {
      try {
        const image = getSingleFilePath(req.files, 'image');
        if (!image) {
          sendResponse(res, {
            success: false,
            statusCode: StatusCodes.BAD_REQUEST,
            message: 'Image is required',
          });
          return;
        }
        req.body.logo = image as string;
        next();
      } catch (error) {
        next(error);
      }
    },
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
    async (req, _res: Response, next: NextFunction) => {
      try {
        const image = getSingleFilePath(req.files, 'image');
        req.body.logo = image as string;
        next();
      } catch (error) {
        next(error);
      }
    },
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
