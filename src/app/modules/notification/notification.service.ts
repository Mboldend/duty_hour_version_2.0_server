import { JwtPayload } from 'jsonwebtoken';
import { Notification } from './notification.model';
import { USER_ROLES } from '../../../enums/user';
import { User } from '../user/user.model';
import { sendNotifications } from '../../../helpers/notificationHelper';
import ApiError from '../../../errors/ApiError';

interface AdminNotifyInput {
  title: string;
  message: string;
  receiver?: string;
}

// get notifications for admin
const superAdminNotificationsFromDB = async () => {
  const result = await Notification.find({ type: USER_ROLES.SUPER_ADMIN });
  return result;
};

// read notifications only for admin
const superAdminReadNotificationToDB = async () => {
  const result = await Notification.updateMany(
    { read: false },
    { $set: { read: true } },
    { new: true },
  );
  return result;
};

// read single notification
const adminReadNotificationByIdToDB = async (id: string) => {
  const result = await Notification.findByIdAndUpdate(
    { _id: id, read: false },
    { $set: { read: true } },
    { new: true },
  );
  return result;
};

const sendNotifyBusinessOwnersToDB = async (input: AdminNotifyInput) => {
  let notificationsToSend: any[] = [];

  if (input.receiver) {
    // single user
    const user = await User.findOne({
      _id: input.receiver,
      role: USER_ROLES.BUSINESS_OWNER,
    });
    if (!user) throw new Error('Business owner not found');

    notificationsToSend.push({
      title: input.title,
      message: input.message,
      receiver: user._id,
      type: 'ADMIN_NOTIFY',
    });
  } else {
    // all business owners
    const owners = await User.find({ role: USER_ROLES.BUSINESS_OWNER });
    notificationsToSend = owners.map(owner => ({
      title: input.title,
      message: input.message,
      receiver: owner._id,
      type: 'ADMIN_NOTIFY',
    }));
  }

  // send notifications using your reusable function
  const results = [];
  for (const notification of notificationsToSend) {
    const result = await sendNotifications(notification);
    results.push(result);
  }

  return results;
};

// get notifications
const getBusinessOwnerNotificationsFromDB = async (user: JwtPayload) => {
  const result = await Notification.find({
    receiver: user.id,
    type: {
      $in: ['BUSINESS_OWNER', 'SHIFT_CHANGE', 'LEAVE_REQUEST', 'ADMIN_NOTIFY'],
    },
  })
    .populate({ path: 'data.institution', select: 'institutionName' })
    .populate({ path: 'data.department', select: 'departmentName' })
    .populate({
      path: 'data.shiftSchedule',
      select: 'shiftName shiftStartTime shiftEndTime',
    });

  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    read: false,
  });

  const data = {
    result,
    unreadCount,
  };

  return data;
};

// read notifications only for user
const readBusinessOwnerNotificationToDB = async (user: JwtPayload) => {
  const result = await Notification.updateMany(
    { receiver: user.id, read: false },
    { $set: { read: true } },
  );
  return result;
};

// get notifications
const getHrAndDepartManagerNotificationsFromDB = async (user: JwtPayload) => {
  const result = await Notification.find({
    receiver: user.id,
    type: { $in: ['SHIFT_CHANGE', 'LEAVE_REQUEST'] },
  })
    .populate({ path: 'data.institution', select: 'institutionName' })
    .populate({ path: 'data.department', select: 'departmentName' })
    .populate({
      path: 'data.shiftSchedule',
      select: 'shiftName shiftStartTime shiftEndTime',
    });

  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    read: false,
  });

  const data = {
    result,
    unreadCount,
  };

  return data;
};

const readHrAndDepartManagerNotificationsFromDB = async (user: JwtPayload) => {
  const result = await Notification.updateMany(
    { receiver: user.id, read: false },
    { $set: { read: true } },
  );
  return result;
};

const getEmployeeNotificationsFromDB = async (user: JwtPayload) => {
  const result = await Notification.find({
    type: 'EMPLOYEE_REQUEST_STATUS',
  });

  const unreadCount = await Notification.countDocuments({
    receiver: user.id,
    read: false,
  });

  const data = {
    result,
    unreadCount,
  };

  return data;
};

const readEmployeeNotificationsFromDB = async (user: JwtPayload) => {
  const result = await Notification.updateMany(
    { receiver: user.id, read: false },
    { $set: { read: true } },
  );
  return result;
};

const deleteNotificationByIdFromDB = async (
  notificationId: string,
  user: JwtPayload,
) => {
  const result = await Notification.findOneAndDelete({
    _id: notificationId,
    receiver: user.id,
  });

  if (!result) {
    throw new ApiError(404, 'Notification not found or already deleted');
  }

  return result;
};

const deleteAllNotificationsFromDB = async (user: JwtPayload) => {
  const result = await Notification.deleteMany({
    receiver: user.id,
  });

  if (!result.deletedCount || result.deletedCount === 0) {
    throw new ApiError(404, 'No notifications found for this user');
  }

  return {
    success: true,
    message: `${result.deletedCount} notification(s) deleted successfully`,
  };
};

const deleteAllAdminNotificationsFromDB = async () => {
  const result = await Notification.deleteMany({
    type: 'SUPER_ADMIN',
  });
  if (!result.deletedCount || result.deletedCount === 0) {
    throw new ApiError(404, 'No notifications is found');
  }
  return result;
};

export const NotificationService = {
  superAdminNotificationsFromDB,
  getBusinessOwnerNotificationsFromDB,
  readBusinessOwnerNotificationToDB,
  superAdminReadNotificationToDB,
  adminReadNotificationByIdToDB,
  sendNotifyBusinessOwnersToDB,
  // getNotifyBusinessOwnersFromDB,
  getEmployeeNotificationsFromDB,
  getHrAndDepartManagerNotificationsFromDB,
  readHrAndDepartManagerNotificationsFromDB,
  readEmployeeNotificationsFromDB,
  deleteNotificationByIdFromDB,
  deleteAllNotificationsFromDB,
  deleteAllAdminNotificationsFromDB,
};
