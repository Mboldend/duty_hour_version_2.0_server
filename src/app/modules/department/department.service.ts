import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { IDepartment } from './department.interface';
import { Department } from './department.model';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import { STATUS } from '../../../shared/constant';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import QueryBuilder from '../../builder/QueryBuilder';
import { Institution } from '../institution/institution.model';

const createDepartmentToDB = async (payload: IDepartment, user: JwtPayload) => {
  payload.createdBy = user.id;
  // get the institution from db
  const institution = await Institution.findById(payload.institutionID).lean();
  if (!institution) {
    return {
      status: 'NOT_FOUND',
    } as const;
  }
  const result = await Department.create(payload);

  if (!result) {
    return {
      status: 'FAILED',
    } as const;
  }

  return result;
};

const getDepartmentsFromDB = async (
  userId: JwtPayload,
  query: Record<string, any>,
) => {
  const qb = new QueryBuilder(Department.find({ createdBy: userId.id }), query)
    .sort()
    .paginate()
    .fields()
    .populate(['createdBy', 'institutionID'], {
      createdBy: 'name email profileImage role',
      institutionID: 'institutionName logo',
    });
  const [data, meta] = await Promise.all([
    qb.modelQuery.lean(),
    qb.getPaginationInfo(),
  ]);
  return {
    data,
    meta,
  };
};

const getDepartmentByIdFromDB = async (
  userId: string,
  departmentId: string,
) => {
  // trace root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all user IDs under root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // validate department
  const department = await Department.findOne({
    _id: departmentId,
    createdBy: { $in: allUserIds },
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'institutionID',
      select: 'institutionName logo',
      populate: { path: 'owner', select: 'name email role profileImage' },
    });

  if (!department) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Department not found or access denied',
    );
  }

  // aggregate count of active employees in the department
  const result = await User.aggregate([
    {
      $match: {
        departmentID: department._id,
        status: STATUS.ACTIVE,
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
      },
    },
  ]);

  const employeeCount = result[0]?.total || 0;

  // inline update using lean object instead of extra DB call
  department.totalEmployee = employeeCount;
  await department.save(); // optional: only if you want to persist

  return department;
};

const updateDepartmentByIdToDB = async (
  userId: string,
  departmentID: string,
  updatedPayload: Partial<IDepartment>,
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

  // check if department is owned by a valid user
  const department = await Department.findOne({
    _id: departmentID,
    createdBy: { $in: allUserIds },
  });

  if (!department) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Department not found or access denied',
    );
  }

  const updatedDepartment = await Department.findByIdAndUpdate(
    departmentID,
    updatedPayload,
    { new: true },
  )
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'institutionID',
      select: 'institutionName logo',
      populate: { path: 'owner', select: 'name email role profileImage' },
    });

  return updatedDepartment;
};

const updateDepartmentStatusByIdToDB = async (
  userId: string,
  departmentID: string,
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

  // check if department is owned by a valid user
  const department = await Department.findOne({
    _id: departmentID,
    createdBy: { $in: allUserIds },
  });

  if (!department) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Department not found or access denied',
    );
  }

  const updatedDepartmentStatus = await Department.findByIdAndUpdate(
    departmentID,
    { status },
    { new: true },
  )
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'institutionID',
      select: 'institutionName logo',
      populate: { path: 'owner', select: 'name email role profileImage' },
    });

  return updatedDepartmentStatus;
};

const deleteDepartmentByIdFromDB = async (
  userId: string,
  departmentID: string,
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

  // check if department is owned by a valid user
  const department = await Department.findOne({
    _id: departmentID,
    createdBy: { $in: allUserIds },
  });

  if (!department) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Department not found or access denied',
    );
  }

  const deleteDepartment = await Department.findByIdAndDelete(departmentID)
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'institutionID',
      select: 'institutionName logo',
      populate: { path: 'owner', select: 'name email role profileImage' },
    });

  return deleteDepartment;
};

export const DepartmentServices = {
  createDepartmentToDB,
  getDepartmentsFromDB,
  getDepartmentByIdFromDB,
  updateDepartmentByIdToDB,
  updateDepartmentStatusByIdToDB,
  deleteDepartmentByIdFromDB,
};
