import { Types } from 'mongoose';
import { MANUAL_STATUS, STATUS } from './attendance.constant';

export type TAttendance = {
  userID: Types.ObjectId;
  wifiIPAddress: string;
  wifiSSID?: string;
  latitude: string;
  longitude: string;
  institutionID: Types.ObjectId;
  locationID: Types.ObjectId;
  departmentID: Types.ObjectId;
  shiftID?: Types.ObjectId;
  checkInTime: Date | null;
  checkOutTime: Date | null;
  durationMinutes: number;
  status: STATUS;
  sessions: {
    startTime: Date;
    endTime: Date | null;
  }[];
  createdAt: string;
  updatedAt: string;

  // new fields for manual entry
  isManual?: boolean;
  manualStatus?: MANUAL_STATUS;
  manualReason?: string;
  manualRequestDate?: string;
  manualReviewedBy?: Types.ObjectId;
  manualReviewedAt?: Date;
  manualReviewerNote?: string;
};
