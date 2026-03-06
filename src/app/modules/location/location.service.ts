import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { Location } from './location.model';
import { ILocation } from './location.interface';
import { JwtPayload } from 'jsonwebtoken';
import { User } from '../user/user.model';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { STATUS } from '../../../shared/constant';
import QueryBuilder from '../../builder/QueryBuilder';
import { Institution } from '../institution/institution.model';

const createLocation = async (payload: ILocation, user: JwtPayload) => {
  const isUserExists = await User.isExistUserByEmail(user.email);
  if (!isUserExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  payload.createdBy = user.id;

  const location = await Location.create(payload);

  if (!location) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create location');
  }

  return location;
};

const getLocationsFromDB = async (
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

  // institutionName → institutionID
  let institutionIDFilter: string | undefined;
  if (query.institutionName) {
    const matchedInstitution = await Institution.findOne({
      institutionName: { $regex: query.institutionName, $options: 'i' },
      owner: rootOwnerId,
    }).select('_id');

    if (matchedInstitution) {
      institutionIDFilter = matchedInstitution._id.toString();
    } else {
      return { data: [], meta: { total: 0, limit: 10, page: 1, totalPage: 0 } };
    }

    // remove from raw query so filter() doesn’t misbehave
    delete query.institutionName;
  }

  const baseQuery: any = {
    createdBy: { $in: allUserIds },
  };

  if (institutionIDFilter) {
    baseQuery.institutionID = institutionIDFilter;
  }

  const builder = new QueryBuilder(Location.find(baseQuery), query)
    .filter()
    .sort()
    .paginate()
    .populate(['createdBy', 'institutionID'], {
      createdBy: 'name email profileImage role',
      institutionID: 'institutionName logo',
    });

  const [data, meta] = await Promise.all([
    builder.modelQuery,
    builder.getPaginationInfo(),
  ]);

  return { data, meta };
};

const getLocationByIdFromDB = async (userId: string, locationID: string) => {
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

  // find the location if it's created by an allowed user
  const location = await Location.findOne({
    _id: locationID,
    createdBy: { $in: allUserIds },
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' });

  if (!location) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Location not found or access denied',
    );
  }

  return location;
};

const updateLocationByIdToDB = async (
  userId: string,
  locationID: string,
  updatedPayload: Partial<ILocation>,
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

  // check if location is owned by a valid user
  const location = await Location.findOne({
    _id: locationID,
    createdBy: { $in: allUserIds },
  });

  if (!location) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Location not found or access denied',
    );
  }

  const updatedLocation = await Location.findByIdAndUpdate(
    locationID,
    updatedPayload,
    { new: true },
  ).populate({ path: 'createdBy', select: 'name email profileImage role' });

  return updatedLocation;
};

const updateLocationStatusByIdToDB = async (
  userId: string,
  locationID: string,
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

  // check if location is owned by a valid user
  const location = await Location.findOne({
    _id: locationID,
    createdBy: { $in: allUserIds },
  });

  if (!location) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Location not found or access denied',
    );
  }

  const updatedLocationStatus = await Location.findByIdAndUpdate(
    locationID,
    { status },
    { new: true },
  ).populate({ path: 'createdBy', select: 'name email profileImage role' });

  return updatedLocationStatus;
};

const deleteLocationByIdFromDB = async (userId: string, locationID: string) => {
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

  // tet all valid user IDs under the root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // check if location is owned by a valid user
  const location = await Location.findOne({
    _id: locationID,
    createdBy: { $in: allUserIds },
  });

  if (!location) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Location not found or access denied',
    );
  }

  const deleteLocation = await Location.findByIdAndDelete(locationID).populate({
    path: 'createdBy',
    select: 'name email profileImage role',
  });

  return deleteLocation;
};

export const LocationServices = {
  createLocation,
  getLocationsFromDB,
  getLocationByIdFromDB,
  updateLocationByIdToDB,
  updateLocationStatusByIdToDB,
  deleteLocationByIdFromDB,
};
