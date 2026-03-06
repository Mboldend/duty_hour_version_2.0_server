import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { AnalyticsControllers } from './analytics.controller';
import { checkAccessFromRootSubscription } from '../../../util/checkAccessFromRootSubscription';

const router = express.Router();

router.get(
  '/absents',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  AnalyticsControllers.getAbsents,
);

router.get(
  '/lates',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  AnalyticsControllers.getLates,
);

router.get(
  '/present-summary/last-seven-days',
  auth(USER_ROLES.BUSINESS_OWNER, USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
  checkAccessFromRootSubscription,
  AnalyticsControllers.getPresentSummaryLastSevenDays,
);

router.get(
  '/today-summary',
  auth(USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER, USER_ROLES.BUSINESS_OWNER),
  checkAccessFromRootSubscription,
  AnalyticsControllers.getTodayAttendanceSummary,
);

router.get(
  '/summary/last-seven-days',
  auth(USER_ROLES.BUSINESS_OWNER),
  checkAccessFromRootSubscription,
  AnalyticsControllers.getLastSevenDaysSummaryForBusinessOwner,
);

router.get(
  '/summary',
  auth(USER_ROLES.BUSINESS_OWNER),
  checkAccessFromRootSubscription,
  AnalyticsControllers.getDashboardSummary,
);

router.get(
  '/monthly-revenue',
  auth(USER_ROLES.SUPER_ADMIN),
  AnalyticsControllers.getRevenueByMonth,
);

router.get(
  '/summary-stats',
  auth(USER_ROLES.SUPER_ADMIN),
  AnalyticsControllers.getSummaryStats,
);

router.get(
  '/institutions',
  auth(USER_ROLES.SUPER_ADMIN),
  AnalyticsControllers.getRecentInstitutions,
);

export const AnalyticsRoutes = router;
