import { USER_ROLES } from '../../../enums/user';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { STATUS } from '../attendance/attendance.constant';
import { Attendance } from '../attendance/attendance.model';
import { User } from '../user/user.model';
import { subDays, startOfDay, addDays, format, endOfDay } from 'date-fns';
import mongoose from 'mongoose';
import { Institution } from '../institution/institution.model';
import { Department } from '../department/department.model';
import { Subscription } from '../subscription/subscription.model';
import { SUBSCRIPTION_STATUS } from '../subscription/subscription.constant';
import { STATUS as ACTIVE_STATUS } from '../../../shared/constant';
import QueryBuilder from '../../builder/QueryBuilder';

const getAbsentsFromDB = async (userId: string) => {
  // trace up to root owner
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

  // base query: only ABSENT attendances
  const baseQuery: any = {
    userID: { $in: allUserIds },
    status: STATUS.ABSENT,
  };

  // execute query
  const result = await Attendance.find(baseQuery)
    .populate(
      'userID',
      'name email profileImage role weekend phone employeeID status',
    )
    .populate('institutionID', 'institutionName logo')
    .populate('departmentID', 'departmentName totalEmployee')
    .populate('shiftID', 'shiftName shiftStartTime shiftEndTime')
    .sort({ createdAt: -1 })
    .limit(2);

  return result;
};

const getLatesFromDB = async (userId: string) => {
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

  const baseQuery: any = {
    userID: { $in: allUserIds },
    status: STATUS.LATE,
  };

  const result = await Attendance.find(baseQuery)
    .populate(
      'userID',
      'name email profileImage role weekend phone employeeID status',
    )
    .populate('institutionID', 'institutionName logo')
    .populate('departmentID', 'departmentName totalEmployee')
    .populate('shiftID', 'shiftName shiftStartTime shiftEndTime')
    .sort({ createdAt: -1 })
    .limit(10);

  // late calculation
  const enrichedResult = result.map((att: any) => {
    const shiftStart = att.shiftID?.shiftStartTime;
    const checkIn = att.checkInTime;

    let minutesLate = null;

    if (shiftStart && checkIn) {
      const diffMs =
        new Date(checkIn).getTime() - new Date(shiftStart).getTime();
      minutesLate = Math.floor(diffMs / 60000);
    }

    return {
      ...att.toObject(),
      minutesLate,
    };
  });

  return enrichedResult;
};


const getPresentSummaryLastSevenDaysFromDB = async (userId: string) => {
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
  const totalEmployees = await User.countDocuments({
    _id: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) },
    role: USER_ROLES.EMPLOYEE,
    status: 'ACTIVE',
  });

  // date range: last 7 days
  // const today = startOfDay(new Date());
  const today = endOfDay(new Date());
  const startDate = startOfDay(subDays(today, 6)); // includes today

  // fetch PRESENT attendances using checkInTime
  const attendanceData = await Attendance.aggregate([
    {
      $match: {
        userID: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) },
        status: STATUS.PRESENT,
        checkInTime: { $gte: startDate, $lte: today },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$checkInTime',
          },
        },
        presentCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        presentCount: 1,
      },
    },
  ]);

  // map date => presentCount
  const presentMap: Record<string, number> = {};
  attendanceData.forEach(item => {
    presentMap[item.date] = item.presentCount;
  });

  // weekday mapping
  const getDayName = (dateObj: Date): string => {
    return format(dateObj, 'EEE');
  };

  const finalResult = [];
  let totalPresentCount = 0;

  for (let i = 0; i < 7; i++) {
    const dateObj = addDays(startDate, i);
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    const day = getDayName(dateObj);

    const presentCount = presentMap[dateStr] || 0;
    totalPresentCount += presentCount;

    const percentage =
      totalEmployees > 0
        ? parseFloat(((presentCount / totalEmployees) * 100).toFixed(2))
        : 0;

    let changeFromYesterday: number | null = null;
    if (i > 0) {
      const prevDateStr = format(addDays(startDate, i - 1), 'yyyy-MM-dd');
      const prevCount = presentMap[prevDateStr] || 0;

      if (prevCount > 0) {
        changeFromYesterday = parseFloat(
          (((presentCount - prevCount) / prevCount) * 100).toFixed(2),
        );
      } else if (presentCount > 0) {
        changeFromYesterday = 100;
      } else {
        changeFromYesterday = 0;
      }
    }

    finalResult.push({
      day,
      presentCount,
      percentage,
      changeFromYesterday,
    });
  }

  return {
    dailySummary: finalResult,
    totalPresentCount,
  };
};

// for hr, department manager
const getTodayAttendanceSummaryFromDB = async (userId: string) => {
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
  const objectIds = allUserIds.map(id => new mongoose.Types.ObjectId(id));

  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const todayEnd = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      23,
      59,
      59,
      999,
    ),
  );

  // attendance aggregation: today checkIn, checkOut, absent count
  const attendanceSummary = await Attendance.aggregate([
    {
      $match: {
        userID: { $in: objectIds },
        createdAt: { $gte: todayStart, $lte: todayEnd },
      },
    },
    {
      $group: {
        _id: null,
        totalCheckIn: {
          $sum: { $cond: [{ $ne: ['$checkInTime', null] }, 1, 0] },
        },
        totalCheckOut: {
          $sum: { $cond: [{ $ne: ['$checkOutTime', null] }, 1, 0] },
        },
        totalAbsent: {
          $sum: { $cond: [{ $eq: ['$status', STATUS.ABSENT] }, 1, 0] },
        },
      },
    },
  ]);

  // total active employees
  const totalEmployees = await User.countDocuments({
    _id: { $in: objectIds },
    role: USER_ROLES.EMPLOYEE,
    status: 'ACTIVE',
  });

  const result = attendanceSummary[0] || {
    totalCheckIn: 0,
    totalCheckOut: 0,
    totalAbsent: 0,
  };

  return {
    totalEmployees,
    todayCheckIn: result.totalCheckIn,
    todayCheckOut: result.totalCheckOut,
    todayAbsent: result.totalAbsent,
  };
};

const getLastSevenDaysSummaryForBusinessOwnerFromDB = async (
  userId: string,
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

  const totalUsers = await User.countDocuments({
    _id: { $in: allUserIds.map(id => new mongoose.Types.ObjectId(id)) },
    status: 'ACTIVE',
    role: USER_ROLES.EMPLOYEE,
  });

  const institutionIds = await Institution.find({
    owner: rootOwnerId,
  })
    .select('_id')
    .lean();

  const totalInstitutons = institutionIds.length;

  const institutionIdList = institutionIds.map(inst => inst._id);

  const totalDepartments = await Department.countDocuments({
    institutionID: { $in: institutionIdList },
    status: 'ACTIVE',
  });

  const subscription = await Subscription.findOne({
    userId: rootOwnerId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  }).sort({ currentPeriodEnd: -1 });

  const remainingDays = subscription?.remainingDays;

  const result = {
    totalInstitutons,
    totalDepartments,
    totalUsers,
    remainingDays,
  };

  return result;
};

// statistics for business owner
const getDashboardSummaryFromDB = async (userId: string) => {
  // Step 1: trace root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // Step 2: get all userIds under root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // Step 3: count summary data
  const [totalInstitutions, totalDepartments, totalUsers] = await Promise.all([
    Institution.countDocuments({ owner: { $in: allUserIds } }),
    Department.countDocuments({ createdBy: { $in: allUserIds } }),
    User.countDocuments({
      _id: { $in: allUserIds },
      status: 'ACTIVE',
      role: USER_ROLES.EMPLOYEE,
    }),
  ]);

  const subscription = await Subscription.findOne({
    userId: rootOwnerId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  }).sort({ currentPeriodEnd: -1 });

  const remainingDays = subscription?.remainingDays;

  return {
    totalInstitutions,
    totalDepartments,
    totalUsers,
    remainingDays,
  };
};

const getRevenueByMonthFromDB = async (year: number) => {
  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year}-12-31T23:59:59Z`);

  const raw = await Subscription.aggregate([
    {
      $match: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        totalRevenue: { $sum: '$price' },
      },
    },
    {
      $project: {
        _id: 0,
        monthNumber: '$_id',
        totalRevenue: 1,
      },
    },
  ]);

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const monthlyRevenue = monthNames.map((name, index) => {
    const found = raw.find(item => item.monthNumber === index + 1);
    return {
      month: name,
      revenue: found ? found.totalRevenue : 0,
    };
  });

  return monthlyRevenue;
};

const getSummaryStatsFromDB = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);

  const [totalEarningResult, totalInstitutions, totalSubscriptions] =
    await Promise.all([
      Subscription.aggregate([
        {
          $match: {
            status: SUBSCRIPTION_STATUS.ACTIVE,
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$price' },
          },
        },
      ]),
      Institution.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
      Subscription.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      }),
    ]);

  return {
    totalEarning: totalEarningResult[0]?.total || 0,
    totalInstitutions,
    totalSubscriptions,
  };
};

const getRecentInstitutionsFromDB = async (query: any) => {
  const baseQuery = Institution.find({ status: ACTIVE_STATUS.ACTIVE });

  const queryBuilder = new QueryBuilder(baseQuery, query);

  const institutionsQuery = queryBuilder.filter().sort().paginate().fields();

  const institutions = await institutionsQuery.modelQuery;
  const meta = await queryBuilder.getPaginationInfo();

  return {
    meta,
    data: institutions,
  };
};

export const AnalyticsServices = {
  getAbsentsFromDB,
  getLatesFromDB,
  getPresentSummaryLastSevenDaysFromDB,
  getTodayAttendanceSummaryFromDB,
  getLastSevenDaysSummaryForBusinessOwnerFromDB,
  getDashboardSummaryFromDB,
  getRevenueByMonthFromDB,
  getSummaryStatsFromDB,
  getRecentInstitutionsFromDB,
};
