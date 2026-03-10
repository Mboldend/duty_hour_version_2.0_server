import { User } from '../user/user.model';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { IUser } from '../user/user.interface';
import { STATUS } from '../../../shared/constant';
import { USER_ROLES } from '../../../enums/user';
import unlinkFile from '../../../shared/unlinkFile';
import { Department } from '../department/department.model';
import { Institution } from '../institution/institution.model';
import { Subscription } from '../subscription/subscription.model';

const getEmployeesFromDB = async (userId: string, query: any) => {
  const page = query.page ? parseInt(query.page, 10) : 1;
  const limit = query.limit ? parseInt(query.limit, 10) : 10;

  const institutionName = query.institutionName?.trim();
  const departmentName = query.departmentName?.trim();
  const search = query.searchTerm?.trim();

  // trace root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // build filter query
  const filterQuery: any = {
    createdBy: { $in: allUserIds },
    role: USER_ROLES.EMPLOYEE,
  };

  // optional name/email search
  if (search) {
    filterQuery.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  // filter by institution name
  if (institutionName) {
    const matchedInstitutions = await Institution.find({
      institutionName: { $regex: institutionName, $options: 'i' },
    }).select('_id');
    const institutionIds = matchedInstitutions.map(i => i._id);
    filterQuery.institutionID = { $in: institutionIds };
  }

  // filter by department name
  if (departmentName) {
    const matchedDepartments = await Department.find({
      departmentName: { $regex: departmentName, $options: 'i' },
    }).select('_id');
    const departmentIds = matchedDepartments.map(d => d._id);
    filterQuery.departmentID = { $in: departmentIds };
  }

  // get total count
  const total = await User.countDocuments(filterQuery);
  const totalPage = Math.ceil(total / limit);

  // fetch paginated data
  const employees = await User.find(filterQuery)
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .populate({ path: 'departmentID', select: 'departmentName totalEmployee' })
    .populate({ path: 'designationID', select: 'designationName' })
    .populate({
      path: 'shiftSchedule',
      select: 'shiftName shiftStartTime shiftEndTime',
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    data: employees,
    meta: {
      total,
      limit,
      page,
      totalPage,
    },
  };
};

const getEmployeeByIdFromDB = async (userId: string, employeeID: string) => {
  // trace root owner from userId
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all user IDs under this root owner (HRs, managers, etc.)
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // find the employee if it's created by an allowed user
  const employee = await User.findOne({
    _id: employeeID,
    createdBy: { $in: allUserIds },
    role: USER_ROLES.EMPLOYEE,
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'institutionID',
      select: 'institutionName logo',
    })
    .populate({ path: 'departmentID', select: 'departmentName totalEmployee' })
    .populate({ path: 'designationID', select: 'designationName' })
    .populate({
      path: 'shiftSchedule',
      select: 'shiftName shiftStartTime shiftEndTime',
    });

  if (!employee) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Employee not found or access denied',
    );
  }

  return employee;
};

const updateEmployeeByIdToDB = async (
  userId: string,
  employeeID: string,
  updatedPayload: Partial<IUser>,
) => {
  // get the requesting user's role
  const requestingUser = await User.findById(userId).select('createdBy role');

  if (!requestingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // trace root owner
  let rootOwnerId = userId;
  let currentUser: any = await User.findById(userId).select('createdBy');

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all valid user IDs under the root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // check if employee is owned by a valid user
  const employee = await User.findOne({
    _id: employeeID,
    createdBy: { $in: allUserIds },
  });

  if (!employee) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Employee not found or access denied',
    );
  }

  const result = await User.findByIdAndUpdate(employeeID, updatedPayload, {
    new: true,
  }).populate({ path: 'createdBy', select: 'name email profileImage role' });

  if (!result) {
    if (updatedPayload.profileImage) {
      unlinkFile(updatedPayload.profileImage);
    }

    throw new ApiError(400, 'Failed to update institution by ID');
  }

  return result;
};

const updateEmployeeStatusByIdToDB = async (
  userId: string,
  employeeID: string,
  status: STATUS.ACTIVE | STATUS.INACTIVE,
) => {
  // get the requesting user's role
  const requestingUser = await User.findById(userId).select('createdBy role');

  if (!requestingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // trace root owner
  let rootOwnerId = userId;
  let currentUser: any = await User.findById(userId).select('createdBy');

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all valid user IDs under the root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // check if employee is owned by a valid user
  const employee = await User.findOne({
    _id: employeeID,
    createdBy: { $in: allUserIds },
  });

  if (!employee) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Employee not found or access denied',
    );
  }

  const updatedEmployeeStatus = await User.findByIdAndUpdate(
    employeeID,
    { status },
    { new: true },
  ).populate({ path: 'createdBy', select: 'name email profileImage role' });

  return updatedEmployeeStatus;
};

const deleteEmployeeByIdFromDB = async (userId: string, employeeID: string) => {
  const result = await User.findByIdAndDelete(employeeID).lean();
  if (!result) {
    return {
      status: 'fail',
    } as const;
  }
  await Subscription.findByIdAndUpdate(
    { userId: userId },
    { $inc: { totalEmployees: -1 } },
    { new: true },
  );
  return result;
};

export const EmployeeServices = {
  getEmployeesFromDB,
  getEmployeeByIdFromDB,
  updateEmployeeByIdToDB,
  updateEmployeeStatusByIdToDB,
  deleteEmployeeByIdFromDB,
};
