import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ShiftServices } from './shift.service';

const createShift = catchAsync(async (req, res) => {
  const result = await ShiftServices.createShiftToDB(req.body, req.user);
  if (result?.status === 'SHIFT_CREATION_FAILED') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Failed to create shift',
      data: result,
    });
    return;
  }
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Shift is created successfully',
    data: result,
  });
});

const getShifts = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await ShiftServices.getShiftsFromDB(id, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Shifts are retrieved successfully',
    data: result,
  });
});

const getShiftById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { shiftID } = req.params;
  const result = await ShiftServices.getShiftByIdFromDB(id, shiftID);
  if (result?.status === 'SHIFT_NOT_FOUND') {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Shift not found in the database',
      data: result,
    });
    return;
  }
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift data is retrieved successfully',
    data: result,
  });
});

const updateShiftById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { shiftID } = req.params;
  const updatedPayload = req.body;
  const result = await ShiftServices.updateShiftByIdToDB(
    id,
    shiftID,
    updatedPayload,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift data is updated successfully',
    data: result,
  });
});

const updateShiftStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { shiftID } = req.params;
  const { status } = req.body;
  const result = await ShiftServices.updateShiftStatusByIdToDB(
    id,
    shiftID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift status is updated successfully',
    data: result,
  });
});

const deleteShiftById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { shiftID } = req.params;
  const result = await ShiftServices.deleteShiftByIdFromDB(id, shiftID);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift is deleted successfully',
    data: result,
  });
});

export const ShiftControllers = {
  createShift,
  getShifts,
  getShiftById,
  updateShiftById,
  updateShiftStatusById,
  deleteShiftById,
};
