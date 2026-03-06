import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ShiftServices } from './shift.service';

const createShift = catchAsync(async (req, res) => {
  const user = req.user;
  const shiftData = req.body;
  const result = await ShiftServices.createShiftToDB(shiftData, user);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shift is created successfully',
    data: result,
  });
});

const getShifts = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await ShiftServices.getShiftsFromDB(id, req.query);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Shifts are retrieved successfully',
    data: result,
  });
});

const getShiftById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { shiftID } = req.params;
  const result = await ShiftServices.getShiftByIdFromDB(id, shiftID);
  sendResponse(res, {
    success: true,
    statusCode: 200,
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
    statusCode: 200,
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
    statusCode: 200,
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
    statusCode: 200,
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
