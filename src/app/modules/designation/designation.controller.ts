import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DesignationServices } from './designation.service';

const createDesignation = catchAsync(async (req, res) => {
  const roleData = req.body;
  const user = req.user;
  const result = await DesignationServices.createDesignationToDB(
    roleData,
    user,
  );
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
  if (result.status === "FAILED") {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Failed to create designation',
      data: result,
    });
    return;
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Designation created successfully',
    data: result,
  });
});

const getAllDesignation = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await DesignationServices.getDesignationsFromDB(id, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Designation retrieved successfully',
    data: result,
  });
});

const getDesignationById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { designationID } = req.params;
  const result = await DesignationServices.getDesignationByIdFromDB(
    id,
    designationID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Designation data is retrieved successfully',
    data: result,
  });
});

const updateDesignationById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { designationID } = req.params;
  const updatedPayload = req.body;
  const result = await DesignationServices.updateDesignationByIdToDB(
    id,
    designationID,
    updatedPayload,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Designation data is updated successfully',
    data: result,
  });
});

const updateDesignationStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { designationID } = req.params;
  const { status } = req.body;
  const result = await DesignationServices.updateDesignationStatusByIdToDB(
    id,
    designationID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Designation status is updated successfully',
    data: result,
  });
});

const deleteDesignationById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { designationID } = req.params;
  const result = await DesignationServices.deleteDesignationByIdFromDB(
    id,
    designationID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Designation is deleted successfully',
    data: result,
  });
});

export const DesignationControllers = {
  createDesignation,
  getAllDesignation,
  getDesignationById,
  updateDesignationById,
  updateDesignationStatusById,
  deleteDesignationById,
};
