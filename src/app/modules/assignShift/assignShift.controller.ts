import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AssignShiftServices } from './assignShift.service';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';

const createAssignShiftToDB = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AssignShiftServices.createAssignShiftToDB(req.body);
    if (result?.status === 'EMPLOYEE_ALREADY_ASSIGNED_TO_A_SHIFT') {
      return sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CONFLICT,
        message: 'Employee already assigned to a shift',
        data: result,
      });
    }
    if (result?.status === 'SHIFT_NOT_FOUND') {
      return sendResponse(res, {
        success: true,
        statusCode: StatusCodes.NOT_FOUND,
        message: 'Shift not found in the database',
        data: result,
      });
    }
    sendResponse(res, {
      success: true,
      statusCode: StatusCodes.CREATED,
      message: 'Shift assigned successfully',
      data: result,
    });
  },
);

const updateAssignedShift = catchAsync(async (req: Request, res: Response) => {
  const result = await AssignShiftServices.updateAssignedShiftToDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Shift assignment updated successfully',
    data: result,
  });
});

export const AssignShiftControllers = {
  createAssignShiftToDB,
  updateAssignedShift,
};
