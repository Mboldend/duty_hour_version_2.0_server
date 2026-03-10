import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ShiftAndLeaveRequestServices } from './shiftAndLeaveRequest.service';

const createShiftAndLeaveRequest = catchAsync(async (req, res) => {
  const { id } = req.user;
  const shiftAndLeaveData = req.body;
  const result =
    await ShiftAndLeaveRequestServices.createShiftAndLeaveRequestToDB(
      shiftAndLeaveData,
      id,
    );
  if (result?.status === 'USER_NOT_FOUND') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'User not found',
    });
    return;
  }
  if (result?.status === 'VACATION_REQUEST_OVERLAPPING') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Vacation request overlapping',
    });
    return;
  }
  if (result?.status === 'REQUESTED_SHIFT_ID_AND_DATE_REQUIRED') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Requested shift ID and date required',
    });
    return;
  }
  if (result?.status === 'SHIFT_CHANGE_REQUEST_OVERLAPPING') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Shift change request overlapping',
    });
    return;
  }
  if (result?.status === 'INVALID_REQUEST_TYPE') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Invalid request type',
    });
    return;
  }
  if (result?.status === 'FAILED_TO_CREATE_SHIFT_AND_LEAVE_REQUEST') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Failed to create shift and leave request',
    });
    return;
  }
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.CREATED,
    message: 'Shift and leave request is created successfully',
    data: result,
  });
});

const getShiftAndLeaveRequests = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result =
    await ShiftAndLeaveRequestServices.getShiftAndLeaveRequestsFromDB(
      id,
      req.query,
    );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Shift and live requests are retrieved successfully',
    data: result,
  });
});

const getShiftAndLeaveRequestById = catchAsync(async (req, res) => {
  const result =
    await ShiftAndLeaveRequestServices.getShiftAndLeaveRequestByIdFromDB(
      req.user.id!,
      req.params.shiftAndLeaveRequestID,
    );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift and leave request data is retrieved successfully',
    data: result,
  });
});

const updateShiftAndLeaveRequestStatusById = catchAsync(async (req, res) => {
  const result =
    await ShiftAndLeaveRequestServices.updateShiftAndLeaveRequestStatusByIdToDB(
      req.user.id!,
      req.params.shiftAndLeaveRequestID,
      req.body.status,
    );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift and leave request status is updated successfully',
    data: result,
  });
});

const updateMultipleShiftAndLeaveRequestStatuses = catchAsync(
  async (req, res) => {
    const result =
      await ShiftAndLeaveRequestServices.updateMultipleShiftAndLeaveRequestStatusesToDB(
        req.user.id!,
        req.body,
      );
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.OK,
      message:
        'Multiple shift and leave request statuses are updated successfully',
      data: result,
    });
  },
);

const getOwnShiftRequests = catchAsync(async (req, res) => {
  const result = await ShiftAndLeaveRequestServices.getOwnShiftRequestsFromDB(
    req.user.id!,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift request data are retrieved successfully',
    data: result,
  });
});

const getOwnLeaveRequests = catchAsync(async (req, res) => {
  const result = await ShiftAndLeaveRequestServices.getOwnLeaveRequestsFromDB(
    req.user.id!,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Leave request data are retrieved successfully',
    data: result,
  });
});

export const ShiftAndLeaveRequestControllers = {
  createShiftAndLeaveRequest,
  getShiftAndLeaveRequests,
  getShiftAndLeaveRequestById,
  updateShiftAndLeaveRequestStatusById,
  updateMultipleShiftAndLeaveRequestStatuses,
  getOwnShiftRequests,
  getOwnLeaveRequests,
};
