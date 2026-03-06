import { model, Schema } from 'mongoose';
import { TNotification } from './notification.interface';

enum NotificationType {
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  PAYMENT = 'PAYMENT',
  MESSAGE = 'MESSAGE',
  REFUND = 'REFUND',
  ALERT = 'ALERT',
  ORDER = 'ORDER',
  ADMIN_NOTIFY = 'ADMIN_NOTIFY',
  BUSINESS_OWNER = 'BUSINESS_OWNER',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DELIVERY = 'DELIVERY',
  CANCELLED = 'CANCELLED',
  LEAVE_REQUEST = 'LEAVE_REQUEST',
  SHIFT_CHANGE = 'SHIFT_CHANGE',
  EMPLOYEE_REQUEST_STATUS = 'EMPLOYEE_REQUEST_STATUS',
}

const notificationSchema = new Schema<TNotification>(
  {
    title: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    data: {
      employeeID: {
        type: String,
      },
      institution: {
        type: Schema.Types.ObjectId,
        ref: 'Institution',
      },
      department: {
        type: Schema.Types.ObjectId,
        ref: 'Department',
      },
      shiftSchedule: {
        type: Schema.Types.ObjectId,
        ref: 'Shift',
      },
    },

    read: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
    },
  },
  {
    timestamps: true,
  },
);

export const Notification = model<TNotification>(
  'Notification',
  notificationSchema,
);
