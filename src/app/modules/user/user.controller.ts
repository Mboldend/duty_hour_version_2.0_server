import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { UserService } from './user.service';
import ApiError from '../../../errors/ApiError';

const createUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { ...userData } = req.body;
    const result = await UserService.createUserToDB(userData);

    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Business owner account created successfully',
      data: result,
    });
  },
);

const createSubUserByOwner = catchAsync(async (req, res) => {
  const result = await UserService.createSubUserByOwnerToDB(
    req.body,
    req.user!,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Successfully create employee!!!',
    data: result,
  });
});

const createEmployee = catchAsync(async (req, res) => {


  const result = await UserService.createEmployeeToDB(req.body, req.user!);
  if (result && typeof result === "object" && "status" in result) {

    if (result.status === "INSTITUTION_NOT_FOUND") {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Institution not found',
        data: result,
      });
      return;
    }
    if (result.status === "DEPARTMENT_NOT_FOUND") {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Department not found',
        data: result,
      });
      return;
    }
    if (result.status === "SHIFT_NOT_FOUND") {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Shift not found',
        data: result,
      });
      return;
    }
    if (result.status === "PAYMENT_REQUIRED") {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.PAYMENT_REQUIRED,
        message: 'Payment required',
        data: result,
      });
      return;
    }
  }
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee is created successfully',
    data: result,
  });
});

const getUserProfile = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const result = await UserService.getUserProfileFromDB(user);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile data retrieved successfully',
    data: result,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const user = req.user;
  let image = '';

  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const profileFile = files?.profileImage?.[0];
  if (profileFile) {
    image = `/uploads/image/${profileFile.filename}`;
  }

  const data = {
    profileImage: image,
    ...req.body,
  };

  const result = await UserService.updateProfileToDB(user, data);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Profile updated successfully',
    data: result,
  });
});

const getInstitutionsByOwnerId = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await UserService.getInstitutionsByOwnerIdFromDB(
    id,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institutions are retrieved successfully by business owner ID',
    data: result,
  });
});

const getSubUsers = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await UserService.getSubUsersFromDB(id, req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Sub User data are retrieved successfully',
    data: result,
  });
});

const getSubUserById = catchAsync(async (req, res) => {
  const { id: userId } = req.user;
  const { subUserId } = req.params;
  const result = await UserService.getSubUserByIdFromDB(userId, subUserId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Sub user is retrieved successfully',
    data: result,
  });
});

const getBusinessOwners = catchAsync(async (req, res) => {
  const result = await UserService.getBusinessOwnersFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Get business oweners are retrieved successfully',
    data: result,
  });
});

const getAllBusinessOwners = catchAsync(async (req, res) => {
  const result = await UserService.getAllBusinessOwnersFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Get all business owners are retrieved successfully',
    data: result,
  });
});

const updateSubUserById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { subUserID } = req.params;
  const updatedPayload = req.body;
  const result = await UserService.updateSubUserByIdToDB(
    id,
    subUserID,
    updatedPayload,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Sub user is updated successfully',
    data: result,
  });
});

const updateSubUserStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { subUserID } = req.params;
  const { status } = req.body;
  const result = await UserService.updateSubUserStatusByIdToDB(
    id,
    subUserID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Sub user status is updated successfully',
    data: result,
  });
});

const updateStatusById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const result = await UserService.updateStatusToDB(id, status);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Business owner status is updated successfully',
    data: result,
  });
});

const deleteSubUserById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { subUserID } = req.params;
  const result = await UserService.deleteSubUserByIdFromDB(id, subUserID);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Sub user is deleted successfully',
    data: result,
  });
});

export const UserController = {
  createUser,
  createSubUserByOwner,
  createEmployee,
  getUserProfile,
  updateProfile,
  getSubUsers,
  updateSubUserById,
  updateSubUserStatusById,
  deleteSubUserById,
  getBusinessOwners,
  updateStatusById,
  getInstitutionsByOwnerId,
  getSubUserById,
  getAllBusinessOwners,
};
