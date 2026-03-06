import ApiError from '../../../errors/ApiError';
import { Department } from '../department/department.model';
import { Institution } from '../institution/institution.model';
import { Shift } from '../shift/shift.model';
import { SHIFT_STATUS } from '../user/user.constant';
import { User } from '../user/user.model';

const createAssignShiftToDB = async (payload: any) => {
  const institution = await Institution.findById(payload.institutionID);
  if (!institution)
    throw new ApiError(404, 'No institution found in the database');

  const department = await Department.findById(payload.departmentID);
  if (!department)
    throw new ApiError(404, 'No department found in the database');

  const employee = await User.findOne({
    institutionID: payload.institutionID,
    departmentID: payload.departmentID,
    employeeID: payload.employeeID,
  });

  if (!employee)
    throw new ApiError(404, 'No employee found with given information');

  // prevent duplicate shift assignment
  if (
    employee.shiftStatus === SHIFT_STATUS.ASSIGNED &&
    employee.shiftSchedule
  ) {
    throw new ApiError(409, 'This employee is already assigned to a shift');
  }

  const shift = await Shift.findById(payload.shiftID);
  if (!shift) throw new ApiError(404, 'No shift found in the database');

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
    throw new ApiError(404, 'Employee not found with the provided information');
  }

  // check if the employee already has a shift assigned
  if (
    employee.shiftStatus !== SHIFT_STATUS.ASSIGNED ||
    !employee.shiftSchedule
  ) {
    throw new ApiError(400, 'This employee does not have any shift assigned');
  }

  // find the new shift to assign
  const newShift = await Shift.findById(shiftID);
  if (!newShift) {
    throw new ApiError(404, 'Shift not found in the database');
  }

  // prevent updating with the same shift
  if (employee.shiftSchedule.toString() === shiftID) {
    throw new ApiError(409, 'This shift is already assigned to the employee');
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
