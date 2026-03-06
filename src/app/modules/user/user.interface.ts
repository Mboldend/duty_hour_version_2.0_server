import { Model, Schema, Types } from 'mongoose';
import { USER_ROLES } from '../../../enums/user';
import { DAY, GENDER, STATUS } from '../../../shared/constant';
import { SHIFT_STATUS } from './user.constant';

export type IUser = {
  _id?: Types.ObjectId;
  institutionID?: Types.ObjectId;
  departmentID?: Types.ObjectId;
  designationID?: Types.ObjectId;
  weekend?: DAY[];
  shiftSchedule?: Types.ObjectId;
  joiningDate?: string;
  gender?: GENDER;
  emergencyContact?: string;
  employeeID?: string;
  name: string;
  role?: USER_ROLES;
  phone?: string;
  countryCode?: string;
  email: string;
  password: string;
  address?: string;
  profileImage?: string;
  status: STATUS;
  shiftStatus?: SHIFT_STATUS;
  verified: boolean;
  createdBy?: Types.ObjectId;
  stripeCustomerId?: string;
  isSubscribed?: boolean;
  hasAccess?: boolean;
  packageName?: string;
  authentication?: {
    isResetPassword: boolean;
    oneTimeCode: number;
    expireAt: Date;
  };
};

export type UserModal = {
  isExistUserById(id: string): any;
  isExistUserByEmail(email: string): any;
  isMatchPassword(password: string, hashPassword: string): boolean;
} & Model<IUser>;
