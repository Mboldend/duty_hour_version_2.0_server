import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Department } from '../department/department.model';
import { Institution } from '../institution/institution.model';
import { Shift } from '../shift/shift.model';
import { SHIFT_STATUS } from '../user/user.constant';
import { User } from '../user/user.model';

const createAssignShiftToDB = async (payload: any) => {
  const { institutionID, departmentID, employeeID } = payload;
  if (!institutionID || !departmentID || !employeeID) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid payload');
  }
  const employee = await User.findOne({
    institutionID,
    departmentID,
    employeeID,
  });

  if (!employee)
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No employee found with given information',
    );

  // prevent duplicate shift assignment
  if (
    employee.shiftStatus === SHIFT_STATUS.ASSIGNED &&
    employee.shiftSchedule
  ) {
    return {
      status: 'EMPLOYEE_ALREADY_ASSIGNED_TO_A_SHIFT',
    } as const;
  }

  const shift = await Shift.findById(payload.shiftID);
  if (!shift) {
    return {
      status: 'SHIFT_NOT_FOUND',
    } as const;
  }

  const updatedPayload = {
    shiftSchedule: payload.shiftID,
    shiftStatus: SHIFT_STATUS.ASSIGNED,
  };

  const result = await User.findByIdAndUpdate(
    employee._id,
    {
      $set: updatedPayload,
    },
    { new: true },
  );

  return result;
};

const updateAssignedShiftToDB = async (payload: any) => {
  const { institutionID, departmentID, employeeID, shiftID } = payload;

  // find the employee under the given institution and department
  const employee = await User.findOne({
    institutionID,
    departmentID,
    employeeID,
  });

  if (!employee) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Employee not found with the provided information',
    );
  }

  // check if the employee already has a shift assigned
  if (
    employee.shiftStatus !== SHIFT_STATUS.ASSIGNED ||
    !employee.shiftSchedule
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'This employee does not have any shift assigned',
    );
  }

  // find the new shift to assign
  const newShift = await Shift.findById(shiftID);
  if (!newShift) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Shift not found in the database',
    );
  }

  // prevent updating with the same shift
  if (employee.shiftSchedule.toString() === shiftID) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This shift is already assigned to the employee',
    );
  }

  // update the employee's shift
  const result = await User.findByIdAndUpdate(
    employee._id,
    {
      $set: {
        shiftSchedule: shiftID,
      },
    },
    { new: true },
  );

  return result;
};

export const AssignShiftServices = {
  createAssignShiftToDB,
  updateAssignedShiftToDB,
};
