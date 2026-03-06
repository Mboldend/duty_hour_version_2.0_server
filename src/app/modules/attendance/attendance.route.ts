import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AttendanceControllers } from './attendance.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';

const router = express.Router();

router.get(
  '/weekly-analytics',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.getWeeklyAttendanceAnalytics,
);

router.get(
  '/me',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.getEmployeeOwnAttendances,
);

router.get(
  '/me/weekly',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.getEmployeeWeeklyAttendances,
);

router.get(
  '/me/today',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.getEmployeeTodayAttendance,
);

router.get(
  '/me/weekly-report',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.getEmployeeWeeklyReport,
);

router.get(
  '/me/monthly-report',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.getEmployeeMonthlyReport,
);

router.get(
  '/self/filter',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.getSelfFilteredAttendance,
);

router
  .route('/')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    AttendanceControllers.getAllAttendances,
  );

router.post(
  '/checkin',
  auth(USER_ROLES.EMPLOYEE),
  checkAccessFromRootSubscription,
  AttendanceControllers.checkin,
);

router.post(
  '/manual',
  auth(USER_ROLES.EMPLOYEE),
  AttendanceControllers.requestManualPresent,
);

router
  .route('/:attendanceID')
  .get(
    auth(
      USER_ROLES.BUSINESS_OWNER,
      USER_ROLES.HR,
      USER_ROLES.DEPARTMENT_MANAGER,
    ),
    checkAccessFromRootSubscription,
    AttendanceControllers.getAttendanceById,
  );

router.get(
  '/:userID/summary',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  AttendanceControllers.getAttendanceSummaryByIdFromDB,
);

router.get(
  '/user/:targetUserID',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  AttendanceControllers.getUserAttendances,
);

export const AttendanceRoutes = router;
