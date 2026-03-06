import { Types } from 'mongoose';

export type TNotification = {
  title?: string;
  message: string;
  receiver: Types.ObjectId;
  reference?: string;
  data?: any;
  read: boolean;
  type?:
    | 'ADMIN'
    | 'REFUND'
    | 'ORDER'
    | 'ADMIN_NOTIFY'
    | 'DELIVERY'
    | 'CANCELLED'
    | 'SUPER_ADMIN'
    | 'BUSINESS_OWNER'
    | 'SYSTEM'
    | 'PAYMENT'
    | 'MESSAGE'
    | 'ALERT'
    | 'LEAVE_REQUEST'
    | 'SHIFT_CHANGE'
    | 'EMPLOYEE_REQUEST_STATUS';
};
