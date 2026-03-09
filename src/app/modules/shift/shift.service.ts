import { JwtPayload } from 'jsonwebtoken';
import { Shift } from './shift.model';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import dayjs from 'dayjs';
import { User } from '../user/user.model';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { TShift } from './shift.interface';
import { STATUS } from '../../../shared/constant';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import QueryBuilder from '../../builder/QueryBuilder';
import { HydratedDocument } from 'mongoose';
dayjs.extend(isSameOrBefore);

const createShiftToDB = async (payload: any, user: JwtPayload) => {
  const [startHour, startMinute] = payload.shiftStartTime
    ?.split(':')
    .map(Number);
  const [endHour, endMinute] = payload.shiftEndTime?.split(':').map(Number);

  const today = dayjs().format('YYYY-MM-DD');
  let shiftStartTime = dayjs(`${today}T00:00:00`)
    .hour(startHour)
    .minute(startMinute)
    .second(0)
    .millisecond(0);

  let shiftEndTime = dayjs(`${today}T00:00:00`)
    .hour(endHour)
    .minute(endMinute)
    .second(0)
    .millisecond(0);

  // overnight shift check: end time
  if (
    shiftEndTime.isBefore(shiftStartTime) ||
    shiftEndTime.isSame(shiftStartTime)
  ) {
    shiftEndTime = shiftEndTime.add(1, 'day');
  }

  const finalPayload = {
    shiftName: payload.shiftName,
    shiftStartTime: shiftStartTime.toISOString(),
    shiftEndTime: shiftEndTime.toISOString(),
    createdBy: user.id,
  };

  const result = await Shift.create(finalPayload);
  if (!result) {
    return {
      status: 'SHIFT_CREATION_FAILED',
    } as const;
  }

  return result;
};

const getShiftByIdFromDB = async (userId: string, shiftID: string) => {
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

  // find the shift if it's created by an allowed user
  const shift = await Shift.findOne({
    _id: shiftID,
    createdBy: { $in: allUserIds },
  }).populate({ path: 'createdBy', select: 'name email profileImage role' });

  if (!shift) {
    return {
      status: 'SHIFT_NOT_FOUND',
    } as const;
  }

  return shift;
};

const getShiftsFromDB = async (userId: string, query: any) => {
  // trace up to root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  const builder = new QueryBuilder<HydratedDocument<TShift>>(
    Shift.find({ createdBy: { $in: allUserIds } }),
    query,
  )
    .filter()
    .sort()
    .paginate()
    .populate(['createdBy'], {
      createdBy: 'name email profileImage role',
    });

  const shifts = await builder.modelQuery;

  const result = await Promise.all(
    shifts.map(async shift => {
      const employeeCount = await User.countDocuments({
        shiftSchedule: shift._id,
      });

      return {
        ...shift.toObject(),
        totalEmployee: employeeCount,
      };
    }),
  );

  const meta = await builder.getPaginationInfo();

  return { data: result, meta };
};

const updateShiftByIdToDB = async (
  userId: string,
  shiftID: string,
  updatedPayload: Partial<TShift>,
) => {
  const requestingUser = await User.findById(userId).select('createdBy role');
  if (!requestingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  let rootOwnerId = userId;
  let currentUser: any = requestingUser;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  const shift = await Shift.findOne({
    _id: shiftID,
    createdBy: { $in: allUserIds },
  });

  if (!shift) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Shift not found or access denied',
    );
  }

  const today = dayjs().format('YYYY-MM-DD');
  let shiftStartTime: dayjs.Dayjs | null = null;
  let shiftEndTime: dayjs.Dayjs | null = null;

  // shiftStartTime ISO time
  if (updatedPayload.shiftStartTime) {
    const [startHour, startMinute] = updatedPayload.shiftStartTime
      .split(':')
      .map(Number);
    shiftStartTime = dayjs(`${today}T00:00:00`)
      .hour(startHour)
      .minute(startMinute)
      .second(0)
      .millisecond(0);

    updatedPayload.shiftStartTime = shiftStartTime.toISOString();
  }

  // shiftEndTime  ISO
  if (updatedPayload.shiftEndTime) {
    const [endHour, endMinute] = updatedPayload.shiftEndTime
      .split(':')
      .map(Number);
    shiftEndTime = dayjs(`${today}T00:00:00`)
      .hour(endHour)
      .minute(endMinute)
      .second(0)
      .millisecond(0);

    // overnight check
    if (shiftStartTime && shiftEndTime.isSameOrBefore(shiftStartTime)) {
      shiftEndTime = shiftEndTime.add(1, 'day');
    }

    updatedPayload.shiftEndTime = shiftEndTime.toISOString();
  }

  const updatedShift = await Shift.findByIdAndUpdate(shiftID, updatedPayload, {
    new: true,
  }).populate({ path: 'createdBy', select: 'name email profileImage role' });

  return updatedShift;
};

const updateShiftStatusByIdToDB = async (
  userId: string,
  shiftID: string,
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

  // check if shift is owned by a valid user
  const shift = await Shift.findOne({
    _id: shiftID,
    createdBy: { $in: allUserIds },
  });

  if (!shift) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Shift not found or access denied',
    );
  }

  // perform the update
  const updatedShiftStatus = await Shift.findByIdAndUpdate(
    shiftID,
    { status },
    { new: true },
  ).populate({ path: 'createdBy', select: 'name email profileImage role' });

  return updatedShiftStatus;
};

const deleteShiftByIdFromDB = async (userId: string, shiftID: string) => {
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

  // check if shift is owned by a valid user
  const shift = await Shift.findOne({
    _id: shiftID,
    createdBy: { $in: allUserIds },
  });

  if (!shift) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Shift not found or access denied',
    );
  }

  // perform the update
  const deleteShift = await Shift.findByIdAndDelete(shiftID).populate({
    path: 'createdBy',
    select: 'name email profileImage role',
  });

  return deleteShift;
};

export const ShiftServices = {
  createShiftToDB,
  getShiftsFromDB,
  getShiftByIdFromDB,
  updateShiftByIdToDB,
  updateShiftStatusByIdToDB,
  deleteShiftByIdFromDB,
};
