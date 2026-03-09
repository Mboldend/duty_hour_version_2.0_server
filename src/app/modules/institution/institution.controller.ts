import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { InstitutionServices } from './institution.service';

const createInstitution = catchAsync(async (req, res) => {
  const result = await InstitutionServices.createInstitutionToDB(
    req.body,
    req.user,
  );

  if (result.status === 'FAILED') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Failed to create institution',
      data: result,
    });
    return;
  }
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Institution created successfully',
    data: result,
  });
});

const getInstitution = catchAsync(async (req, res) => {
  const { id, role } = req.user;
  const result = await InstitutionServices.getInstitutionsFromDB(
    id,
    role,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Institution data are retrieved successfully',
    data: result,
  });
});

const getInstitutionById = catchAsync(async (req, res) => {
  const { id, role } = req.user;
  const { institutionID } = req.params;
  const result = await InstitutionServices.getInstitutionByIdFromDB(
    id,
    role,
    institutionID,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Institution data is retrieved successfully',
    data: result,
  });
});

const getInstitutionByIdForSuperAdmin = catchAsync(async (req, res) => {
  const { institutionID } = req.params;
  const result =
    await InstitutionServices.getInstitutionByIdForSuperAdminFromDB(
      institutionID,
    );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Institution is retrieved successfully',
    data: result,
  });
});

const updateInstitutionStatusByIdForSuperAdmin = catchAsync(
  async (req, res) => {
    const { institutionID } = req.params;
    const { status } = req.body;
    const result =
      await InstitutionServices.updateInstitutionStatusByIdForSuperAdminToDB(
        institutionID,
        status,
      );
    if (result.status === 'FAILED') {
      sendResponse(res, {
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Failed to update institution status',
        data: result,
      });
      return;
    }
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message: 'Institution status is updated successfully',
      data: result,
    });
  },
);

const updateInstitutionById = catchAsync(async (req, res) => {
  const result = await InstitutionServices.updateInstitutionByIdToDB(
    req.user,
    req.params.institutionID,
    req.body,
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Institution is updated successfully',
    data: result,
  });
});

const updateInstitutionStatusById = catchAsync(async (req, res) => {
  const result = await InstitutionServices.updateInstitutionStatusByIdToDB(
    req.user,
    req.params.institutionID,
    req.body.status,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Institution status update successfully',
    data: result,
  });
});

const deleteInstitutionById = catchAsync(async (req, res) => {
  const result = await InstitutionServices.deleteInstitutionByIdFromDB(
    req.user,
    req.params.institutionID,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Institution is deleted successfully',
    data: result,
  });
});

export const InstitutionControllers = {
  createInstitution,
  getInstitution,
  getInstitutionById,
  updateInstitutionById,
  updateInstitutionStatusById,
  deleteInstitutionById,
  getInstitutionByIdForSuperAdmin,
  updateInstitutionStatusByIdForSuperAdmin,
};
