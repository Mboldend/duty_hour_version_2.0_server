import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';

const superAdminNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.superAdminNotificationsFromDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin notifications are retrieved successfully',
    data: result,
  });
});

const superAdminReadNotification = catchAsync(async (req, res) => {
  const result = await NotificationService.superAdminReadNotificationToDB();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin notifications are read successfully',
    data: result,
  });
});

const adminReadNotificationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await NotificationService.adminReadNotificationByIdToDB(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Admin notification is read successfully',
    data: result,
  });
});

const sendNotifyBusinessOwners = catchAsync(async (req, res) => {
  const notificationData = req.body;
  const result =
    await NotificationService.sendNotifyBusinessOwnersToDB(notificationData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: notificationData.receiverId
      ? 'Notification successfully sent to the selected business owner.'
      : 'Notification successfully sent to all business owners.',
    data: result,
  });
});

const getBusinessOwnerNotifications = catchAsync(async (req, res) => {
  const user = req.user;
  const result =
    await NotificationService.getBusinessOwnerNotificationsFromDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Business owners notifications are retrieved successfully',
    data: result,
  });
});

const readBusinessOwnerNotification = catchAsync(async (req, res) => {
  const user = req.user;
  const result =
    await NotificationService.readBusinessOwnerNotificationToDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Business owners notifications are read successfully',
    data: result,
  });
});

const getHrAndDepartManagerNotifications = catchAsync(async (req, res) => {
  const user = req.user;
  const result =
    await NotificationService.getHrAndDepartManagerNotificationsFromDB(user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message:
      'Hr and department manager notifications are retrieved successfully',
    data: result,
  });
});

const readHrAndDepartManagerNotifications = catchAsync(async (req, res) => {
  const user = req.user;
  const result =
    await NotificationService.readHrAndDepartManagerNotificationsFromDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Hr and department manager notifications are read successfully',
    data: result,
  });
});

const getEmployeeNotifications = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationService.getEmployeeNotificationsFromDB(user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee notifications are retrieved successfully',
    data: result,
  });
});

const readEmployeeNotifications = catchAsync(async (req, res) => {
  const user = req.user;
  const result =
    await NotificationService.readEmployeeNotificationsFromDB(user);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Employee notifications are read Successfully',
    data: result,
  });
});

const deleteNotificationById = catchAsync(async (req, res) => {
  const { notificationId } = req.params;
  const user = req.user;
  const result = await NotificationService.deleteNotificationByIdFromDB(
    notificationId,
    user,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Notification is deleted successfully',
    data: result,
  });
});

const deleteAllNotifications = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await NotificationService.deleteAllNotificationsFromDB(user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Delete all notifications',
    data: result,
  });
});

const deleteAllAdminNotifications = catchAsync(async (req, res) => {
  const result = await NotificationService.deleteAllAdminNotificationsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Delete all notifications',
    data: result,
  });
});

export const NotificationController = {
  superAdminNotifications,
  getBusinessOwnerNotifications,
  readBusinessOwnerNotification,
  superAdminReadNotification,
  adminReadNotificationById,
  sendNotifyBusinessOwners,
  // getNotifyBusinessOwners,
  getEmployeeNotifications,
  readEmployeeNotifications,
  readHrAndDepartManagerNotifications,
  getHrAndDepartManagerNotifications,
  deleteNotificationById,
  deleteAllNotifications,
  deleteAllAdminNotifications,
};
