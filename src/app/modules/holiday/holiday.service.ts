import { JwtPayload } from 'jsonwebtoken';
import { THoliday } from './holiday.interface';
import { Holiday } from './holiday.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { User } from '../user/user.model';
import { differenceInCalendarDays } from 'date-fns';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { STATUS } from '../../../shared/constant';
import QueryBuilder from '../../builder/QueryBuilder';

const createHolidayToDB = async (payload: THoliday, user: JwtPayload) => {
  const start = new Date(payload.startDate);
  const end = new Date(payload.endDate);

  if (end < start) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'End date cannot be before start date',
    );
  }

  // convert to ISO for query since DB stores as string
  const startISO = start.toISOString();
  const endISO = end.toISOString();

  // check overlapping holiday (string-based compare)
  const existingHoliday = await Holiday.findOne({
    createdBy: user.id,
    institutionID: payload.institutionID,
    $and: [{ startDate: { $lte: endISO } }, { endDate: { $gte: startISO } }],
  });

  if (existingHoliday) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'Holiday already exists in this date range',
    );
  }

  const totalDays = differenceInCalendarDays(end, start) + 1;
  payload.startDate = startISO;
  payload.endDate = endISO;
  payload.totalDay = totalDays;
  payload.createdBy = user.id;

  const result = await Holiday.create(payload);
  if (!result) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create holiday');
  }

  return result;
};

const getHolidaysFromDB = async (userId: string, query: any) => {
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

  // build query with QueryBuilder
  const builder = new QueryBuilder(
    Holiday.find({ createdBy: { $in: allUserIds } }),
    query,
  )
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

const getHolidayByIdFromDB = async (userId: string, holidayID: string) => {
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

  // find the holiday if it's created by an allowed user
  const holiday = await Holiday.findOne({
    _id: holidayID,
    createdBy: { $in: allUserIds },
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' });

  if (!holiday) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Holiday not found or access denied',
    );
  }

  return holiday;
};

const updateHolidayByIdToDB = async (
  userId: string,
  holidayID: string,
  updatedPayload: Partial<THoliday>,
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

  // check if holiday is owned by a valid user
  const holiday = await Holiday.findOne({
    _id: holidayID,
    createdBy: { $in: allUserIds },
  });

  if (!holiday) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Holiday not found or access denied',
    );
  }

  const updatedHoliday = await Holiday.findByIdAndUpdate(
    holidayID,
    updatedPayload,
    { new: true },
  )
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .sort({ createdAt: -1 });

  return updatedHoliday;
};

const updateHolidayStatusByIdToDB = async (
  userId: string,
  holidayID: string,
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

  // check if holiday is owned by a valid user
  const holiday = await Holiday.findOne({
    _id: holidayID,
    createdBy: { $in: allUserIds },
  });

  if (!holiday) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Holiday not found or access denied',
    );
  }

  const updatedHolidayStatus = await Holiday.findByIdAndUpdate(
    holidayID,
    { status },
    { new: true },
  )
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .sort({ createdAt: -1 });

  return updatedHolidayStatus;
};

const deleteHolidayByIdFromDB = async (userId: string, holidayID: string) => {
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

  // check if holiday is owned by a valid user
  const holiday = await Holiday.findOne({
    _id: holidayID,
    createdBy: { $in: allUserIds },
  });

  if (!holiday) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Holiday not found or access denied',
    );
  }

  const deleteHoliday = await Holiday.findByIdAndDelete(holidayID)
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({ path: 'institutionID', select: 'institutionName logo' })
    .sort({ createdAt: -1 });

  return deleteHoliday;
};

export const HolidayServices = {
  createHolidayToDB,
  getHolidaysFromDB,
  getHolidayByIdFromDB,
  updateHolidayByIdToDB,
  updateHolidayStatusByIdToDB,
  deleteHolidayByIdFromDB,
};
