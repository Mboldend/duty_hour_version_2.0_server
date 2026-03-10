import { STATUS } from './../../../shared/constant';
import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { TInstitution } from './institution.interface';
import { Institution } from './institution.model';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import { USER_ROLES } from '../../../enums/user';
import unlinkFile from '../../../shared/unlinkFile';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { Department } from '../department/department.model';
import QueryBuilder from '../../builder/QueryBuilder';

const createInstitutionToDB = async (
  payload: TInstitution,
  user: JwtPayload,
) => {
  
  // check if user is exist
  const isUserExists = await User.isExistUserByEmail(user.email);

  // add owner
  payload.owner = isUserExists.id;

  const result = await Institution.create(payload);
  if (!result) {
    return {
      status: 'FAILED' as const,
    };
  }

  return result;
};

const getInstitutionsFromDB = async (
  userId: string,
  role: string,
  query: any,
) => {
  let baseQuery;

  if (role === USER_ROLES.BUSINESS_OWNER) {
    baseQuery = Institution.find({ owner: userId });
  } else if (role === USER_ROLES.HR || role === USER_ROLES.DEPARTMENT_MANAGER) {
    let currentUser = await User.findById(userId).select('createdBy');
    let rootOwnerId = userId;

    while (currentUser?.createdBy) {
      rootOwnerId = currentUser.createdBy.toString();
      currentUser = await User.findById(currentUser.createdBy).select(
        'createdBy',
      );
    }

    const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

    baseQuery = Institution.find({ owner: { $in: allUserIds } });
  } else {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied');
  }

  const queryBuilder = new QueryBuilder(baseQuery, query)
    .sort()
    .paginate()
    .fields()
    .populate(['owner'], {
      owner: 'name email role profileImage',
    });

  const institutions = await queryBuilder.modelQuery;
  const pagination = await queryBuilder.getPaginationInfo();

  const institutionIds = institutions.map((inst: any) => inst._id);

  const departmentsCount = await Department.aggregate([
    { $match: { institutionID: { $in: institutionIds } } },
    { $group: { _id: '$institutionID', totalDepartment: { $sum: 1 } } },
  ]);

  const employeesCount = await User.aggregate([
    { $match: { institutionID: { $in: institutionIds } } },
    { $group: { _id: '$institutionID', totalEmployee: { $sum: 1 } } },
  ]);

  const deptCountMap = new Map<string, number>();
  departmentsCount.forEach(dc =>
    deptCountMap.set(dc._id.toString(), dc.totalDepartment),
  );

  const empCountMap = new Map<string, number>();
  employeesCount.forEach(ec =>
    empCountMap.set(ec._id.toString(), ec.totalEmployee),
  );

  const result = institutions.map((inst: any) => {
    return {
      ...inst.toObject(),
      totalDepartment: deptCountMap.get(inst._id.toString()) || 0,
      totalEmployee: empCountMap.get(inst._id.toString()) || 0,
    };
  });

  return {
    data: result,
    meta: pagination,
  };
};

const getInstitutionByIdFromDB = async (
  userId: string,
  role: string,
  institutionId: string,
) => {
  if (role === USER_ROLES.BUSINESS_OWNER) {
    const institution = await Institution.findOne({
      _id: institutionId,
      owner: userId,
    })
      .populate({ path: 'owner', select: 'name email role profileImage' })
      .sort({ createdAt: -1 });

    if (!institution) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Institution not found or access denied.',
      );
    }

    return institution;
  } else if (role === USER_ROLES.HR || role === USER_ROLES.DEPARTMENT_MANAGER) {
    // traverse up to the root BUSINESS_OWNER
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

    // find institution owned by any user under this owner
    const institution = await Institution.findOne({
      _id: institutionId,
      owner: { $in: allUserIds },
    })
      .populate({ path: 'owner', select: 'name email role profileImage' })
      .sort({ createdAt: -1 });

    if (!institution) {
      throw new ApiError(
        StatusCodes.NOT_FOUND,
        'Institution not found or access denied.',
      );
    }

    return institution;
  } else {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Access denied.');
  }
};

const getInstitutionByIdForSuperAdminFromDB = async (id: string) => {
  const institution = await Institution.findById(id).populate({
    path: 'owner',
    select: 'name email phone',
  });
  if (!institution) {
    throw new ApiError(404, 'No institution is found in the database');
  }

  return institution;
};

const updateInstitutionStatusByIdForSuperAdminToDB = async (
  id: string,
  status: STATUS.ACTIVE | STATUS.INACTIVE,
) => {
  const result = await Institution.findByIdAndUpdate(
    id,
    { status },
    { new: true },
  );
  if (!result) {
    return {
      status: 'FAILED' as const,
    };
  }
  return result;
};

const updateInstitutionByIdToDB = async (
  user: JwtPayload,
  id: string,
  payload: Partial<TInstitution>,
) => {
  const ownerId = user.id;

  const institution = await Institution.findById(id);

  if (!institution) {
    throw new ApiError(404, 'Institution is not found in the database');
  }

  const result = await Institution.findOneAndUpdate(
    { _id: id, owner: ownerId },
    payload,
    { new: true },
  );

  if (!result) {
    throw new ApiError(400, 'Failed to update institution by ID');
  }

  return result;
};

const updateInstitutionStatusByIdToDB = async (
  user: JwtPayload,
  id: string,
  status: string,
) => {
  const ownerId = user.id;
  const institution = await Institution.findById(id);
  if (!institution) {
    throw new ApiError(404, 'Institution is not found in the database');
  }

  const result = await Institution.findOneAndUpdate(
    { _id: id, owner: ownerId },
    { status },
    { new: true },
  );

  if (!result) {
    throw new ApiError(404, 'Failed to update status change');
  }

  return result;
};

const deleteInstitutionByIdFromDB = async (user: JwtPayload, id: string) => {
  const ownerId = user.id;
  const result = await Institution.findByIdAndDelete({
    _id: id,
    owner: ownerId,
  });
  if (!result) {
    throw new ApiError(400, 'Failed to delete institution by ID');
  }
  return result;
};

export const InstitutionServices = {
  createInstitutionToDB,
  getInstitutionsFromDB,
  getInstitutionByIdFromDB,
  updateInstitutionByIdToDB,
  updateInstitutionStatusByIdToDB,
  deleteInstitutionByIdFromDB,
  getInstitutionByIdForSuperAdminFromDB,
  updateInstitutionStatusByIdForSuperAdminToDB,
};
