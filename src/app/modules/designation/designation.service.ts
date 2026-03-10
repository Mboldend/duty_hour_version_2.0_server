import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { STATUS } from '../../../shared/constant';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import { TDesignation } from './designation.interface';
import { Designation } from './designation.model';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import QueryBuilder from '../../builder/QueryBuilder';
import { Institution } from '../institution/institution.model';
import { Department } from '../department/department.model';

const createDesignationToDB = async (
  payload: TDesignation,
  user: JwtPayload,
) => {
  payload.createdBy = user.id;
  const [institution, department] = await Promise.all([
    Institution.findById(payload.institutionID),
    Department.findById(payload.departmentID),
  ]);
  if (!institution) {
    return {
      status: 'INSTITUTION_NOT_FOUND',
    } as const;
  }
  if (!department) {
    return {
      status: 'DEPARTMENT_NOT_FOUND',
    } as const;
  }
  const designation = await Designation.create(payload);

  if (!designation) {
    return {
      status: 'FAILED',
    } as const;
  }

  return designation;
};

const getDesignationsFromDB = async (
  userId: string,
  query: Record<string, any>,
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

  // get all user IDs under this root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  const builder = new QueryBuilder(
    Designation.find({ createdBy: { $in: allUserIds } }),
    query,
  )
    .sort()
    .paginate()
    .search(['designationName'])
    .populate(['createdBy', 'institutionID', 'departmentID'], {
      createdBy: 'name email profileImage role',
      institutionID: 'institutionName logo',
      departmentID: 'departmentName totalEmployee',
    });

  const [data, meta] = await Promise.all([
    builder.modelQuery,
    builder.getPaginationInfo(),
  ]);

  return { data, meta };
};

const getDesignationByIdFromDB = async (userId: string, holidayID: string) => {
  //  trace root owner from userId
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

  // find the designation if it's created by an allowed user
  const designation = await Designation.findOne({
    _id: holidayID,
    createdBy: { $in: allUserIds },
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .populate({ path: 'departmentID', select: 'departmentName totalEmployee' })
    .sort({ createdAt: -1 });

  if (!designation) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Designation not found or access denied',
    );
  }

  return designation;
};

const updateDesignationByIdToDB = async (
  userId: string,
  designationID: string,
  updatedPayload: Partial<TDesignation>,
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

  // =check if designation is owned by a valid user
  const designation = await Designation.findOne({
    _id: designationID,
    createdBy: { $in: allUserIds },
  });

  if (!designation) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Designation not found or access denied',
    );
  }

  const updatedDesignation = await Designation.findByIdAndUpdate(
    designationID,
    updatedPayload,
    { new: true },
  )
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .populate({ path: 'departmentID', select: 'departmentName totalEmployee' })
    .sort({ createdAt: -1 });

  return updatedDesignation;
};

const updateDesignationStatusByIdToDB = async (
  userId: string,
  designationID: string,
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

  // check if designation is owned by a valid user
  const designation = await Designation.findOne({
    _id: designationID,
    createdBy: { $in: allUserIds },
  });

  if (!designation) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Designation not found or access denied',
    );
  }

  const updatedDesignationStatus = await Designation.findByIdAndUpdate(
    designationID,
    { status },
    { new: true },
  )
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .populate({ path: 'departmentID', select: 'departmentName totalEmployee' });

  return updatedDesignationStatus;
};

const deleteDesignationByIdFromDB = async (
  userId: string,
  designationID: string,
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

  // check if designation is owned by a valid user
  const designation = await Designation.findOne({
    _id: designationID,
    createdBy: { $in: allUserIds },
  });

  if (!designation) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Designation not found or access denied',
    );
  }

  const deleteDesignation = await Designation.findByIdAndDelete(designationID)
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .populate({ path: 'departmentID', select: 'departmentName totalEmployee' })
    .sort({ createdAt: -1 });

  return deleteDesignation;
};

export const DesignationServices = {
  createDesignationToDB,
  getDesignationsFromDB,
  getDesignationByIdFromDB,
  updateDesignationByIdToDB,
  updateDesignationStatusByIdToDB,
  deleteDesignationByIdFromDB,
};
