import express from 'express';
import auth from '../../middlewares/auth';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';

const router = express.Router();

router.post(
  '/admin/notifications/send',
  auth(USER_ROLES.SUPER_ADMIN),
  NotificationController.sendNotifyBusinessOwners,
);



router
  .route('/business-owner')
  .get(
    auth(USER_ROLES.BUSINESS_OWNER),
    NotificationController.getBusinessOwnerNotifications,
  )
  .patch(
    auth(USER_ROLES.BUSINESS_OWNER),
    NotificationController.readBusinessOwnerNotification,
  );

router
  .route('/super-admin')
  .get(
    auth(USER_ROLES.SUPER_ADMIN),
    NotificationController.superAdminNotifications,
  )
  .patch(
    auth(USER_ROLES.SUPER_ADMIN),
    NotificationController.superAdminReadNotification,
  )
  .delete(
    auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
    NotificationController.deleteAllAdminNotifications,
  );

router.patch(
  '/admin/:id',
  auth(USER_ROLES.SUPER_ADMIN),
  NotificationController.adminReadNotificationById,
);

router
  .route('/employee')
  .get(
    auth(USER_ROLES.EMPLOYEE),
    NotificationController.getEmployeeNotifications,
  )
  .patch(
    auth(USER_ROLES.EMPLOYEE),
    NotificationController.readEmployeeNotifications,
  );

router
  .route('/hr-department-manager')
  .get(
    auth(USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
    NotificationController.getHrAndDepartManagerNotifications,
  )
  .patch(
    auth(USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER),
    NotificationController.readHrAndDepartManagerNotifications,
  );

router.delete(
  '/:notificationId',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.BUSINESS_OWNER,
    USER_ROLES.HR,
    USER_ROLES.DEPARTMENT_MANAGER,
    USER_ROLES.EMPLOYEE,
  ),
  NotificationController.deleteNotificationById,
);

router.delete(
  '/',
  auth(
    USER_ROLES.SUPER_ADMIN,
    USER_ROLES.ADMIN,
    USER_ROLES.BUSINESS_OWNER,
    USER_ROLES.HR,
    USER_ROLES.DEPARTMENT_MANAGER,
    USER_ROLES.EMPLOYEE,
  ),
  NotificationController.deleteAllNotifications,
);

export const NotificationRoutes = router;
