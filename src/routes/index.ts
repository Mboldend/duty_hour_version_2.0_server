import express from 'express';
import { AuthRoutes } from '../app/modules/auth/auth.route';
import { UserRoutes } from '../app/modules/user/user.route';
import { LocationRoutes } from '../app/modules/location/location.route';
import { InstitutionRoutes } from '../app/modules/institution/institution.route';
import { DepartmentRoutes } from '../app/modules/department/department.route';
import { HolidayRoutes } from '../app/modules/holiday/holiday.route';
import { ShiftRoutes } from '../app/modules/shift/shift.route';
import { EmployeeRoutes } from '../app/modules/employee/employee.route';
import { DesignationRoutes } from '../app/modules/designation/designation.route';
import { RuleRoutes } from '../app/modules/rule/rule.route';
import { ContactRoutes } from '../app/modules/contact/contact.route';
import { AssignShiftRoutes } from '../app/modules/assignShift/assignShift.route';
import { ShiftAndLeaveRequestRoutes } from '../app/modules/shiftAndLeaveRequest/shiftAndLeaveRequest.route';
import { AttendanceRoutes } from '../app/modules/attendance/attendance.route';
import { AnalyticsRoutes } from '../app/modules/analytics/analytics.route';
import { PackageRoutes } from '../app/modules/package/package.route';
import { SubscriptionRoutes } from '../app/modules/subscription/subscription.route';
import { EarningRoutes } from '../app/modules/earning/earning.route';
import { NotificationRoutes } from '../app/modules/notification/notification.route';
import { SettingRoutes } from '../app/modules/settings/settings.route';

const router = express.Router();

const apiRoutes = [
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/institutions',
    route: InstitutionRoutes,
  },
  {
    path: '/departments',
    route: DepartmentRoutes,
  },
  {
    path: '/locations',
    route: LocationRoutes,
  },
  {
    path: '/designations',
    route: DesignationRoutes,
  },
  {
    path: '/holidays',
    route: HolidayRoutes,
  },
  {
    path: '/shifts',
    route: ShiftRoutes,
  },
  {
    path: '/employees',
    route: EmployeeRoutes,
  },
  {
    path: '/rules',
    route: RuleRoutes,
  },
  {
    path: '/contacts',
    route: ContactRoutes,
  },
  {
    path: '/assign-shifts',
    route: AssignShiftRoutes,
  },
  {
    path: '/requests',
    route: ShiftAndLeaveRequestRoutes,
  },
  {
    path: '/notifications',
    route: NotificationRoutes,
  },
  {
    path: '/attendances',
    route: AttendanceRoutes,
  },
  {
    path: '/packages',
    route: PackageRoutes,
  },
  {
    path: '/subscriptions',
    route: SubscriptionRoutes,
  },
  {
    path: '/earnings',
    route: EarningRoutes,
  },
  {
    path: '/analytics',
    route: AnalyticsRoutes,
  },
  {
    path: '/settings',
    route: SettingRoutes,
  },
];

apiRoutes.forEach(route => router.use(route.path, route.route));

export default router;
