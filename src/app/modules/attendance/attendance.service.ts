import moment from 'moment';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import { Location } from '../location/location.model';
import { Holiday } from '../holiday/holiday.model';
import { ShiftAndLeaveRequest } from '../shiftAndLeaveRequest/shiftAndLeaveRequest.model';
import { Shift } from '../shift/shift.model';
import { Attendance } from './attendance.model';
import { DAY } from '../../../shared/constant';
import cron from 'node-cron';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { Institution } from '../institution/institution.model';
import mongoose, { Types } from 'mongoose';
import { MANUAL_STATUS, STATUS } from './attendance.constant';
import {
  REQUEST_STATUS,
  REQUEST_TYPE,
} from '../shiftAndLeaveRequest/shiftAndLeaveRequest.constant';
import QueryBuilder from '../../builder/QueryBuilder';
import dayjs from 'dayjs';
import { STATUS as ACTIVE_STATUS } from '../../../shared/constant';

const checkIn = async (userID: string, payload: any) => {
  const { wifiIPAddress, wifiSSID, latitude, longitude } = payload;

  const user = await User.findById(userID);
  if (!user) {
    throw new ApiError(404, 'User not found in database');
  }

  const institution = await Institution.findById(user.institutionID);
  if (!institution) {
    throw new ApiError(400, 'Institution not found');
  }

  const endOfToday = moment.utc().endOf('day').toDate();
  const todayName = moment
    .utc()
    .format('dddd')
    .toUpperCase() as keyof typeof DAY;
  const now = moment.utc();

  // location match
  const location = await Location.findOne({
    institutionID: user.institutionID,
  });
  if (!location)
    throw new ApiError(404, 'No location configured for this institution');

  // validate WiFi credentials
  if (location.wifiIPAddress !== wifiIPAddress) {
    throw new ApiError(
      400,
      'Invalid WiFi credentials. Please connect to the correct network.',
    );
  }

  // check if longitude, and latitude is exists
  if (
    longitude &&
    latitude &&
    location.latitude &&
    location.longitude &&
    location.radius
  ) {
    const distance = getDistance(
      latitude,
      longitude,
      location.latitude,
      location.longitude,
    );
    if (distance > location.radius)
      throw new ApiError(400, 'Outside allowed GPS radius');
  }

  // holiday check
  const today = moment.utc().format('YYYY-MM-DD');
  const isHoliday = await Holiday.findOne({
    institutionID: user.institutionID,
    $expr: {
      $and: [
        { $lte: [{ $substr: ['$startDate', 0, 10] }, today] },
        { $gt: [{ $substr: ['$endDate', 0, 10] }, today] },
      ],
    },
  });

  // vacation check
  const isVacationApproved = await ShiftAndLeaveRequest.findOne({
    userID: user._id,
    requestType: REQUEST_TYPE.VACATION,
    status: REQUEST_STATUS.APPROVE,
    $expr: {
      $and: [
        { $lte: [{ $substr: ['$vacationStartDate', 0, 10] }, today] },
        { $gt: [{ $substr: ['$vacationEndDate', 0, 10] }, today] },
      ],
    },
  });

  // shift Change check
  const approvedShiftChange = await ShiftAndLeaveRequest.findOne({
    userID: user._id,
    requestType: REQUEST_TYPE.SHIFT_CHANGE,
    status: REQUEST_STATUS.APPROVE,
    requestedDate: {
      $regex: `^${today}`,
    },
  });

  const shiftToUse = approvedShiftChange
    ? await Shift.findById(approvedShiftChange.requestedShiftID)
    : await Shift.findById(user.shiftSchedule);

  if (!shiftToUse) {
    throw new ApiError(404, 'No valid shift found');
  }

  // weekend check
  const todayEnumValue = DAY[todayName];
  const isWeekend = user.weekend?.includes(todayEnumValue);

  const shiftStartTimeOnly = moment
    .utc(shiftToUse.shiftStartTime)
    .format('HH:mm:ss');
  const shiftEndTimeOnly = moment
    .utc(shiftToUse.shiftEndTime)
    .format('HH:mm:ss');
  const nowTimeOnly = now.format('HH:mm:ss');

  const shiftStart = moment.utc(shiftStartTimeOnly, 'HH:mm:ss');
  let shiftEnd = moment.utc(shiftEndTimeOnly, 'HH:mm:ss');

  if (shiftEnd.isSameOrBefore(shiftStart)) {
    shiftEnd = shiftEnd.add(1, 'day');
  }

  const nowMoment = moment.utc(nowTimeOnly, 'HH:mm:ss');

  // late time 15 minutes
  const isLate = nowMoment.isAfter(shiftStart.clone().add(15, 'minutes'));
  const isInsideShift = nowMoment.isBetween(shiftStart, shiftEnd);

  // check existing attendance for today (regardless of status)
  const startOfToday = moment.utc().startOf('day').toDate();

  let attendance = await Attendance.findOne({
    userID: user._id,
    createdAt: { $gte: startOfToday, $lte: endOfToday },
  });

  let status: STATUS;

  if (isHoliday) status = STATUS.HOLIDAY;
  else if (isVacationApproved) status = STATUS.LEAVE;
  else if (isWeekend) status = STATUS.OFFDAY;
  else {
    if (!isInsideShift) throw new ApiError(400, 'Not within shift hours');
    status = isLate ? STATUS.LATE : STATUS.PRESENT;
  }

  if (!attendance) {
    attendance = await Attendance.create({
      userID: user._id,
      institutionID: user.institutionID,
      departmentID: user.departmentID,
      locationID: location._id,
      shiftID: shiftToUse._id,
      checkInTime: now.toDate(),
      checkOutTime: now.toDate(),
      durationMinutes: 0,
      status,
    });
  } else {
    attendance.status = status;
    if (!attendance.checkInTime) {
      attendance.checkInTime = now.toDate();
    }
    attendance.checkOutTime = now.toDate();
    attendance.durationMinutes = Math.round(
      (now.toDate().getTime() - new Date(attendance.checkInTime).getTime()) /
        60000,
    );

    await attendance.save();
  }

  return attendance;
};

cron.schedule('*/1 * * * *', async () => {


  const now = moment.utc();
  const startOfToday = now.clone().startOf('day').toDate();
  const endOfToday = now.clone().endOf('day').toDate();
  const todayStr = now.format('YYYY-MM-DD');
  const todayName = now.format('dddd').toUpperCase() as keyof typeof DAY;
  const todayEnumValue = DAY[todayName];
  const nowTimeOnly = now.format('HH:mm:ss');
  const nowMoment = moment.utc(nowTimeOnly, 'HH:mm:ss');

  const allUsers = await User.find({ status: ACTIVE_STATUS.ACTIVE });
  const BATCH_SIZE = 100;

  for (let i = 0; i < allUsers.length; i += BATCH_SIZE) {
    const batch = allUsers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async user => {
        try {
          const alreadyExists = await Attendance.findOne({
            userID: user._id,
            createdAt: { $gte: startOfToday, $lte: endOfToday },
          });
          if (alreadyExists) return;

          const isWeekend = user.weekend?.includes(todayEnumValue);
          const isHoliday = await Holiday.findOne({
            institutionID: user.institutionID,
            $expr: {
              $and: [
                { $lte: [{ $substr: ['$startDate', 0, 10] }, todayStr] },
                { $gte: [{ $substr: ['$endDate', 0, 10] }, todayStr] },
              ],
            },
          });

          const isLeave = await ShiftAndLeaveRequest.findOne({
            userID: user._id,
            status: REQUEST_STATUS.APPROVE,
            requestType: { $in: [REQUEST_TYPE.VACATION] },
            $expr: {
              $and: [
                {
                  $lte: [{ $substr: ['$vacationStartDate', 0, 10] }, todayStr],
                },
                { $gte: [{ $substr: ['$vacationEndDate', 0, 10] }, todayStr] },
              ],
            },
          });

          let statusToSet: STATUS | null = null;
          if (isHoliday) statusToSet = STATUS.HOLIDAY;
          else if (isLeave) statusToSet = STATUS.LEAVE;
          else if (isWeekend) statusToSet = STATUS.OFFDAY;

          const shift = await Shift.findById(user.shiftSchedule);
          if (!shift) return;

          // time-only based shift comparison
          const shiftStartTimeOnly = moment
            .utc(shift.shiftStartTime)
            .format('HH:mm:ss');
          const shiftEndTimeOnly = moment
            .utc(shift.shiftEndTime)
            .format('HH:mm:ss');

          const shiftStart = moment.utc(shiftStartTimeOnly, 'HH:mm:ss');
          let shiftEnd = moment.utc(shiftEndTimeOnly, 'HH:mm:ss');

          // overnight shift handle
          if (shiftEnd.isSameOrBefore(shiftStart)) shiftEnd.add(1, 'day');

          if (!statusToSet) {
            const cutoff = shiftStart.clone().add(3, 'hours');
            if (nowMoment.isAfter(cutoff)) {
              await Attendance.create({
                userID: user._id,
                institutionID: user.institutionID,
                departmentID: user.departmentID,
                shiftID: shift._id,
                checkInTime: null,
                checkOutTime: null,
                durationMinutes: 0,
                status: STATUS.ABSENT,
              });
            }
            return;
          }

          const location = await Location.findOne({
            institutionID: user.institutionID,
          });

          await Attendance.create({
            userID: user._id,
            institutionID: user.institutionID,
            departmentID: user.departmentID,
            locationID: location?._id,
            shiftID: shift._id,
            checkInTime: null,
            checkOutTime: null,
            durationMinutes: 0,
            status: statusToSet,
          });

         
        } catch (err) {
          console.error(`❌ Error processing user ${user.name}:`, err);
        }
      }),
    );
  }

});

// helper function: Haversine formula to calculate distance (in meters)
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

const requestManualPresentFromDB = async (userID: string, payload: any) => {
  const { manualRequestDate, reason } = payload;

  // validate presence
  if (!manualRequestDate) {
    throw new ApiError(400, 'manualRequestDate is required');
  }

  // validate format is exactly YYYY-MM-DD
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(manualRequestDate) ||
    !moment.utc(manualRequestDate, 'YYYY-MM-DD', true).isValid()
  ) {
    throw new ApiError(
      400,
      'Invalid manualRequestDate format, must be YYYY-MM-DD',
    );
  }

  // parse to UTC Date object
  const availableRequestDate = moment
    .utc(manualRequestDate, 'YYYY-MM-DD')
    .toISOString();

  // find user
  const user = await User.findById(userID);
  if (!user) throw new ApiError(404, 'User not found');

  // calculate start and end of day for query filtering
  const startOfDay = moment.utc(manualRequestDate).startOf('day').toDate();
  const endOfDay = moment.utc(manualRequestDate).endOf('day').toDate();

  // check if attendance already exists for the date (manual or auto)
  const existingAttendance = await Attendance.findOne({
    userID,
    checkInTime: { $gte: startOfDay, $lte: endOfDay },
  });

  if (existingAttendance) {
    throw new ApiError(409, 'Attendance already exists for this date');
  }

  // get shift info
  const shift = await Shift.findById(user.shiftSchedule);
  if (!shift) throw new ApiError(404, 'Shift not found for the user');

  // create attendance record with manual flag
  const attendance = await Attendance.create({
    userID,
    institutionID: user.institutionID,
    departmentID: user.departmentID,
    shiftID: shift._id,
    checkInTime: null,
    checkOutTime: null,
    durationMinutes: 0,
    status: STATUS.PRESENT,
    manualRequestDate: availableRequestDate,
    isManual: true,
    manualStatus: MANUAL_STATUS.PENDING,
    manualReason: reason,
  });

  return attendance;
};

const getAllAttendancesFromDB = async (userId: string, query: any) => {
  // trace up to root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all user IDs
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // handle searchTerm
  let userIDsFromSearch: string[] = [];
  let institutionIDsFromSearch: string[] = [];

  if (query.searchTerm) {
    const regex = new RegExp(query.searchTerm, 'i');

    const matchedUsers = await User.find({
      _id: { $in: allUserIds },
      $or: [{ employeeID: regex }, { email: regex }, { name: regex }],
    }).select('_id');

    userIDsFromSearch = matchedUsers.map(u => u._id.toString());

    const matchedInstitutions = await Institution.find({
      institutionName: regex,
      owner: rootOwnerId,
    }).select('_id');

    institutionIDsFromSearch = matchedInstitutions.map(i => i._id.toString());
  }

  // month Filter (by checkInTime or createdAt fallback)
  const monthQuery = query.month || dayjs().utc().format('YYYY-MM');
  const startOfMonth = dayjs.utc(`${monthQuery}-01`).startOf('month').toDate();
  const endOfMonth = dayjs.utc(`${monthQuery}-01`).endOf('month').toDate();

  const dateFilterCondition = {
    $or: [
      { checkInTime: { $gte: startOfMonth, $lte: endOfMonth } },
      {
        checkInTime: null,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
    ],
  };

  const baseQuery: any = {
    userID: { $in: allUserIds },
  };

  if (query.searchTerm) {
    const orConditions: any[] = [];

    if (userIDsFromSearch.length > 0) {
      orConditions.push({ userID: { $in: userIDsFromSearch } });
    }

    if (institutionIDsFromSearch.length > 0) {
      orConditions.push({ institutionID: { $in: institutionIDsFromSearch } });
    }

    if (orConditions.length === 0) {
      orConditions.push({ _id: null });
    }

    baseQuery.$and = [dateFilterCondition, { $or: orConditions }];
  } else {
    baseQuery.$and = [dateFilterCondition];
  }

  delete query.searchTerm;
  delete query.month;

  // queryBuilder with filters, pagination, populate
  const builder = new QueryBuilder(Attendance.find(baseQuery), query)
    .filter()
    .sort()
    .paginate()
    .populate(['userID', 'institutionID', 'departmentID', 'shiftID'], {
      userID: 'name email profileImage role weekend phone employeeID',
      institutionID: 'institutionName logo',
      departmentID: 'departmentName totalEmployee',
      shiftID: 'shiftName shiftStartTime shiftEndTime',
    });

  const [data, meta] = await Promise.all([
    builder.modelQuery,
    builder.getPaginationInfo(),
  ]);

  return { data, meta };
};

const getAttendanceByIdFromDB = async (
  userId: string,
  attendanceID: string,
) => {
  const attendance = await Attendance.findById(attendanceID).select(
    'institutionID userID',
  );
  if (!attendance) throw new ApiError(404, 'Attendance not found');

  const institution = await Institution.findById(
    attendance.institutionID,
  ).select('owner');
  if (!institution) throw new ApiError(404, 'Institution not found');

  const rootOwnerId = institution.owner.toString();

  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  const isAuthorized = allUserIds.some(
    id => id.toString() === userId.toString(),
  );

  if (!isAuthorized) {
    throw new ApiError(403, 'Unauthorized to access this attendance');
  }

  const result = await Attendance.findById(attendanceID).populate([
    { path: 'userID', select: 'name email role profileImage' },
    { path: 'institutionID' },
    { path: 'shiftID' },
    { path: 'locationID' },
  ]);

  return result;
};

const getUserAttendancesFromDB = async (
  requesterId: string,
  targetUserId: string,
  query: any,
) => {
  // root owner trace
  let currentUser = await User.findById(requesterId).select('createdBy');
  let rootOwnerId = requesterId;
  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // access check
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);
  if (!allUserIds.includes(targetUserId)) {
    throw new ApiError(
      403,
      "You are not authorized to view this user's attendance",
    );
  }

  // month filter
  const monthQuery = query.month || dayjs().utc().format('YYYY-MM');
  const startOfMonth = dayjs.utc(`${monthQuery}-01`).startOf('month').toDate();
  const endOfMonth = dayjs.utc(`${monthQuery}-01`).endOf('month').toDate();

  const baseQuery: any = {
    userID: targetUserId,
    isDeleted: { $ne: true },
    $or: [
      { checkInTime: { $gte: startOfMonth, $lte: endOfMonth } },
      {
        checkInTime: null,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
    ],
  };

  const data = await Attendance.find(baseQuery).populate([
    {
      path: 'institutionID',
      select: 'institutionName logo',
    },
    {
      path: 'userID',
      select: 'name role email phone profileImage employeeID weekend',
    },
    {
      path: 'departmentID',
      select: 'departmentName totalEmployee',
    },
    {
      path: 'shiftID',
      select: 'shiftName shiftStartTime shiftEndTime',
    },
    {
      path: 'locationID',
      select: 'wifiIPAddress wifiSSID locationName',
    },
  ]);

  const statusSummary: Record<
    'PRESENT' | 'ABSENT' | 'LEAVE' | 'LATE' | 'HOLIDAY' | 'OFFDAY',
    number
  > = {
    PRESENT: 0,
    ABSENT: 0,
    LEAVE: 0,
    LATE: 0,
    HOLIDAY: 0,
    OFFDAY: 0,
  };

  // count statuses from data
  data.forEach(item => {
    const status = item.status?.toUpperCase();
    if (status && statusSummary.hasOwnProperty(status)) {
      statusSummary[status as keyof typeof statusSummary]++;
    }
  });

  return {
    data,
    statusSummary,
  };
};

const getAttendanceSummaryByIdFromDB = async (
  loggedInUserId: string,
  targetUserId: string,
  month?: number,
  year?: number,
) => {
  // fetch target user and their institution
  const targetUser = await User.findById(targetUserId).select(
    'institutionID weekend',
  );
  if (!targetUser) throw new ApiError(404, 'Target user not found');

  const institution = await Institution.findById(
    targetUser.institutionID,
  ).select('owner');
  if (!institution) throw new ApiError(404, 'Institution not found');

  // authorization check - verify logged-in user is under same root owner
  const rootOwnerId = institution.owner.toString();
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);
  const isAuthorized = allUserIds.some(
    id => id?.toString() === loggedInUserId.toString(),
  );
  if (!isAuthorized)
    throw new ApiError(403, 'You are not authorized to view this summary');

  //  determine date range: from start of month to today (capped)
  const currentDate = moment.utc();
  const usedMonth = month ?? currentDate.month() + 1;
  const usedYear = year ?? currentDate.year();

  const startDate = moment
    .utc()
    .year(usedYear)
    .month(usedMonth - 1)
    .startOf('month');
  const monthEnd = moment
    .utc()
    .year(usedYear)
    .month(usedMonth - 1)
    .endOf('month');
  const endDate = moment.min(currentDate, monthEnd); // capped to today

  // initialize summary result object with all statuses including OFFDAY
  const result: Record<string, number> = {
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    LEAVE: 0,
    HOLIDAY: 0,
    OFFDAY: 0,
  };

  // prepare sets to store leave and holiday dates for exclusion purposes
  const leaveDaysSet = new Set<string>();
  const holidayDaysSet = new Set<string>();

  // === LEAVE calculation ===
  const leaveRequests = await ShiftAndLeaveRequest.find({
    userID: targetUserId,
    requestType: REQUEST_TYPE.VACATION,
    status: REQUEST_STATUS.APPROVE,
    vacationStartDate: { $lte: endDate.toISOString() },
    vacationEndDate: { $gte: startDate.toISOString() },
  });

  for (const leave of leaveRequests) {
    const days = getDateRange(
      moment.utc(leave.vacationStartDate),
      moment.utc(leave.vacationEndDate),
      startDate,
      endDate,
    );
    days.forEach(day => leaveDaysSet.add(day));
    result.LEAVE += days.length;
  }

  // === HOLIDAY calculation ===
  const holidays = await Holiday.find({
    institutionID: targetUser.institutionID,
    startDate: { $lte: endDate.toDate() },
    endDate: { $gte: startDate.toDate() },
  });

  for (const holiday of holidays) {
    const days = getDateRange(
      moment.utc(holiday.startDate),
      moment.utc(holiday.endDate),
      startDate,
      endDate,
    );
    for (const day of days) {
      if (!leaveDaysSet.has(day)) {
        holidayDaysSet.add(day);
        result.HOLIDAY += 1;
      }
    }
  }

  // aggregate attendance summary including OFFDAY from attendance collection
  const summary = await Attendance.aggregate([
    {
      $match: {
        userID: new Types.ObjectId(targetUserId),

        $or: [
          { checkInTime: { $gte: startDate.toDate(), $lte: endDate.toDate() } },
          {
            checkInTime: null,
            createdAt: { $gte: startDate.toDate(), $lte: endDate.toDate() },
          },
        ],
      },
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  for (const item of summary) {
    if (item._id && result.hasOwnProperty(item._id)) {
      result[item._id] = item.count;
    }
  }

  return result;
};

// === Helper function (date range between two dates, capped)
function getDateRange(
  fromDate: moment.Moment,
  toDate: moment.Moment,
  rangeStart: moment.Moment,
  rangeEnd: moment.Moment,
): string[] {
  const start = moment.max(fromDate, rangeStart).startOf('day');
  const end = moment.min(toDate, rangeEnd).startOf('day');
  const days: string[] = [];
  let curr = start.clone();

  while (!curr.isAfter(end)) {
    days.push(curr.format('YYYY-MM-DD'));
    curr.add(1, 'day');
  }

  return days;
}

function getCurrentWeekStartDate(): Date {
  const now = new Date();
  const day = now.getDay(); // Sunday=0, Monday=1, ...
  const diff = day; // Sunday=0, Monday=1, ...
  const sunday = new Date(now);
  sunday.setHours(0, 0, 0, 0);
  sunday.setDate(now.getDate() - diff);
  return sunday;
}

// const getWeeklyAttendanceAnalytics = async (userID: string) => {
//   const weekStartDate = getCurrentWeekStartDate();
//   const weekEndDate = new Date(weekStartDate);
//   weekEndDate.setDate(weekEndDate.getDate() + 7);

//   const result = await Attendance.aggregate([
//     {
//       $match: {
//         userID: new mongoose.Types.ObjectId(userID),
//         checkInTime: { $gte: weekStartDate, $lt: weekEndDate },
//       },
//     },
//     {
//       $group: {
//         _id: {
//           year: { $year: '$checkInTime' },
//           month: { $month: '$checkInTime' },
//           day: { $dayOfMonth: '$checkInTime' },
//         },
//         totalDurationMinutes: { $sum: '$durationMinutes' },
//       },
//     },
//   ]);

//   const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
//   const analytics: Record<string, number> = {};
//   let totalMinutes = 0;

//   for (let i = 0; i < 7; i++) {
//     const date = new Date(weekStartDate);
//     date.setDate(date.getDate() + i);

//     const found = result.find(
//       r =>
//         r._id.year === date.getFullYear() &&
//         r._id.month === date.getMonth() + 1 &&
//         r._id.day === date.getDate(),
//     );

//     const minutes = found ? found.totalDurationMinutes : 0;
//     analytics[daysOfWeek[i]] = minutes;
//     totalMinutes += minutes;
//   }

//   return analytics;
// };

const getWeeklyAttendanceAnalytics = async (userID: string) => {
  const weekStartDate = getCurrentWeekStartDate();
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekEndDate.getDate() + 7);

  const result = await Attendance.aggregate([
    {
      $match: {
        userID: new mongoose.Types.ObjectId(userID),
        checkInTime: { $gte: weekStartDate, $lt: weekEndDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$checkInTime' },
          month: { $month: '$checkInTime' },
          day: { $dayOfMonth: '$checkInTime' },
        },
        totalDurationMinutes: { $sum: '$durationMinutes' },
      },
    },
  ]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const analytics: Record<string, number> = {};
  let cumulativeMinutes = 0;

  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStartDate);
    date.setDate(date.getDate() + i);

    const found = result.find(
      r =>
        r._id.year === date.getFullYear() &&
        r._id.month === date.getMonth() + 1 &&
        r._id.day === date.getDate(),
    );

    const todayMinutes = found ? found.totalDurationMinutes : 0;
    cumulativeMinutes += todayMinutes;

    const dayName = daysOfWeek[date.getDay()];
    analytics[dayName] = cumulativeMinutes;
  }

  return analytics;
};

const getEmployeeOwnAttendancesFromDB = async (userId: string, query: any) => {
  const monthQuery = query.month || dayjs().utc().format('YYYY-MM');
  const startOfMonth = dayjs.utc(`${monthQuery}-01`).startOf('month').toDate();
  const endOfMonth = dayjs.utc(`${monthQuery}-01`).endOf('month').toDate();

  const baseQuery: any = {
    userID: userId,
    $or: [
      { checkInTime: { $gte: startOfMonth, $lte: endOfMonth } },
      {
        checkInTime: null,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
    ],
  };

  const data = await Attendance.find(baseQuery).populate([
    { path: 'institutionID', select: 'institutionName logo' },
    { path: 'departmentID', select: 'departmentName totalEmployee' },
    { path: 'shiftID', select: 'shiftName shiftStartTime shiftEndTime' },
    { path: 'locationID', select: 'wifiIPAddress wifiSSID locationName' },
  ]);

  return data;
};

const getEmployeeWeeklyAttendancesFromDB = async (userId: string) => {
  const startOfWeek = dayjs.utc().startOf('week').toDate(); // Sunday 00:00 UTC
  const endOfWeek = dayjs.utc().endOf('week').toDate(); // Saturday 23:59:59 UTC

  const attendances = await Attendance.find({
    userID: userId,
    $or: [
      { checkInTime: { $gte: startOfWeek, $lte: endOfWeek } },
      {
        checkInTime: null,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      },
    ],
  }).populate([
    {
      path: 'institutionID',
      select: 'institutionName logo',
    },
    {
      path: 'departmentID',
      select: 'departmentName totalEmployee',
    },
    {
      path: 'shiftID',
      select: 'shiftName shiftStartTime shiftEndTime',
    },
    {
      path: 'locationID',
      select: 'wifiIPAddress wifiSSID locationName',
    },
  ]);

  const totalDuration = attendances.reduce((sum, attendance) => {
    return sum + (attendance.durationMinutes || 0);
  }, 0);

  const data = {
    attendances,
    totalDuration,
  };
  return data;
};

const getSelfFilteredAttendanceFromDB = async (userID: string, query: any) => {
  const now = moment.utc();

  const month = Array.isArray(query.month)
    ? query.month[0]
    : (query.month as string | undefined);

  const date = Array.isArray(query.date)
    ? query.date[0]
    : (query.date as string | undefined);

  let selectedDate: moment.Moment;

  if (date) {
    selectedDate = moment.utc(date, 'YYYY-MM-DD');
  } else if (month) {
    const currentDay = now.date();
    selectedDate = moment.utc(
      `${month}-${String(currentDay).padStart(2, '0')}`,
      'YYYY-MM-DD',
    );
  } else {
    selectedDate = now.clone();
  }

  const startOfDay = selectedDate.clone().startOf('day').toDate();
  const endOfDay = selectedDate.clone().endOf('day').toDate();

  const filter: any = {
    userID,
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay,
    },
  };

  const attendance = await Attendance.findOne(filter)
    .populate('institutionID', 'institutionName logo')
    .populate('departmentID', 'departmentName totalEmployee')
    .populate('locationID', 'locationName wifiSSID wifiIPAddress')
    .populate('shiftID', 'shiftName shiftStartTime shiftEndTime');

  return attendance || {};
};

const getEmployeeTodayAttendanceFromDB = async (userId: string) => {
  const startOfDay = dayjs.utc().startOf('day').toDate();
  const endOfDay = dayjs.utc().endOf('day').toDate();

  const attendance = await Attendance.findOne({
    userID: userId,
    $or: [
      { checkInTime: { $gte: startOfDay, $lte: endOfDay } },
      {
        checkInTime: null,
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    ],
  })
    .populate([
      { path: 'institutionID', select: 'institutionName logo' },
      { path: 'departmentID', select: 'departmentName totalEmployee' },
      { path: 'shiftID', select: 'shiftName shiftStartTime shiftEndTime' },
      { path: 'locationID', select: 'wifiIPAddress wifiSSID locationName' },
    ])
    .sort({ createdAt: -1 });

  if (!attendance) {
    throw new ApiError(404, 'No attendance record found');
  }

  return attendance;
};

const getEmployeeWeeklyReportFromDB = async (userId: string) => {
  const startOfWeek = dayjs.utc().startOf('week').toDate(); // Sunday 00:00 UTC
  const endOfWeek = dayjs.utc().endOf('week').toDate(); // Saturday 23:59:59 UTC

  const attendances = await Attendance.find({
    userID: userId,
    $or: [
      { checkInTime: { $gte: startOfWeek, $lte: endOfWeek } },
      {
        checkInTime: null,
        createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      },
    ],
  }).lean();

  // initialize counters
  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    holiday: 0,
    offDay: 0,
    totalWorkingMinutes: 0,
  };

  // map attendance by day for validation
  const dayMap = new Map<string, any>();

  attendances.forEach(att => {
    const dateKey = dayjs(att.checkInTime || att.createdAt)
      .utc()
      .format('YYYY-MM-DD');
    dayMap.set(dateKey, att);

    // count by status
    switch (att.status) {
      case STATUS.PRESENT:
        summary.present++;
        break;
      case STATUS.LATE:
        summary.late++;
        break;
      case STATUS.ABSENT:
        summary.absent++;
        break;
      case STATUS.LEAVE:
        summary.leave++;
        break;
      case STATUS.HOLIDAY:
        summary.holiday++;
        break;
      case STATUS.OFFDAY:
        summary.offDay++;
        break;
    }

    // sum working minutes
    summary.totalWorkingMinutes += att.durationMinutes || 0;
  });

  return {
    summary,
    attendances,
    totalWorkingHours: (summary.totalWorkingMinutes / 60).toFixed(2), // hours with 2 decimal
  };
};

const getEmployeeMonthlyReportFromDB = async (userId: string) => {
  const startOfMonth = dayjs.utc().startOf('month').toDate(); // 1st day of month 00:00 UTC
  const endOfMonth = dayjs.utc().endOf('month').toDate(); // Last day of month 23:59:59 UTC

  const attendances = await Attendance.find({
    userID: userId,
    $or: [
      { checkInTime: { $gte: startOfMonth, $lte: endOfMonth } },
      {
        checkInTime: null,
        createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      },
    ],
  }).lean();

  const summary = {
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    holiday: 0,
    offDay: 0,
    totalWorkingMinutes: 0,
  };

  const dayMap = new Map<string, any>();

  attendances.forEach(att => {
    const dateKey = dayjs(att.checkInTime || att.createdAt)
      .utc()
      .format('YYYY-MM-DD');
    dayMap.set(dateKey, att);

    switch (att.status) {
      case STATUS.PRESENT:
        summary.present++;
        break;
      case STATUS.LATE:
        summary.late++;
        break;
      case STATUS.ABSENT:
        summary.absent++;
        break;
      case STATUS.LEAVE:
        summary.leave++;
        break;
      case STATUS.HOLIDAY:
        summary.holiday++;
        break;
      case STATUS.OFFDAY:
        summary.offDay++;
        break;
    }

    summary.totalWorkingMinutes += att.durationMinutes || 0;
  });

  return {
    summary,
    attendances,
    totalWorkingHours: (summary.totalWorkingMinutes / 60).toFixed(2),
  };
};

export const AttendanceServices = {
  getAllAttendancesFromDB,
  getAttendanceByIdFromDB,
  getAttendanceSummaryByIdFromDB,
  getWeeklyAttendanceAnalytics,
  checkIn,
  getUserAttendancesFromDB,
  getEmployeeOwnAttendancesFromDB,
  getEmployeeWeeklyAttendancesFromDB,
  getSelfFilteredAttendanceFromDB,
  getEmployeeTodayAttendanceFromDB,
  getEmployeeWeeklyReportFromDB,
  getEmployeeMonthlyReportFromDB,
  requestManualPresentFromDB,
};
