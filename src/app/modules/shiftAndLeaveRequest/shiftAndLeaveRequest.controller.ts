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
  sendResponse(res, {
    success: true,
    statusCode: 200,
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
    statusCode: 200,
    success: true,
    message: 'Shift and live requests are retrieved successfully',
    data: result,
  });
});

const getShiftAndLeaveRequestById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { shiftAndLeaveRequestID } = req.params;
  const result =
    await ShiftAndLeaveRequestServices.getShiftAndLeaveRequestByIdFromDB(
      id,
      shiftAndLeaveRequestID,
    );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Shift and leave request data is retrieved successfully',
    data: result,
  });
});

const updateShiftAndLeaveRequestStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { shiftAndLeaveRequestID } = req.params;
  const { status } = req.body;
  const result =
    await ShiftAndLeaveRequestServices.updateShiftAndLeaveRequestStatusByIdToDB(
      id,
      shiftAndLeaveRequestID,
      status,
    );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Shift and leave request status is updated successfully',
    data: result,
  });
});

const updateMultipleShiftAndLeaveRequestStatuses = catchAsync(
  async (req, res) => {
    const { id } = req.user;
    const updatedData = req.body;
    const result =
      await ShiftAndLeaveRequestServices.updateMultipleShiftAndLeaveRequestStatusesToDB(
        id,
        updatedData,
      );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message:
        'Multiple shift and leave request statuses are updated successfully',
      data: result,
    });
  },
);

const getOwnShiftRequests = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result =
    await ShiftAndLeaveRequestServices.getOwnShiftRequestsFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Shift request data are retrieved successfully',
    data: result,
  });
});

const getOwnLeaveRequests = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result =
    await ShiftAndLeaveRequestServices.getOwnLeaveRequestsFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
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
