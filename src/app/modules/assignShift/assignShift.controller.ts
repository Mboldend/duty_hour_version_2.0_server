import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AssignShiftServices } from './assignShift.service';

const createAssignShiftToDB = catchAsync(async (req, res) => {
  const assignShiftData = req.body;
  const result =
    await AssignShiftServices.createAssignShiftToDB(assignShiftData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Successfully shift assigned',
    data: result,
  });
});

const updateAssignedShift = catchAsync(async (req, res) => {
  const updatedPayload = req.body;
  const result =
    await AssignShiftServices.updateAssignedShiftToDB(updatedPayload);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Assign shift updated successfully',
    data: result,
  });
});

export const AssignShiftControllers = {
  createAssignShiftToDB,
  updateAssignedShift,
};
