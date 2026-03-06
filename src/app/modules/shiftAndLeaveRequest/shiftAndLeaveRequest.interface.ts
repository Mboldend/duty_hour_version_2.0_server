import { Types } from 'mongoose';
import { REQUEST_STATUS, REQUEST_TYPE } from './shiftAndLeaveRequest.constant';

export type TShiftAndLeaveRequest = {
  requestType: REQUEST_TYPE;
  userID: Types.ObjectId;

  // common fields
  reason: string;
  status: REQUEST_STATUS;
  decisionDate?: Date;

  // shift-specific (if requestType === 'SHIFT_CHANGE')
  currentShiftID?: Types.ObjectId;
  requestedShiftID?: Types.ObjectId;
  requestedDate?: string;

  // vacation-specific (if requestType === 'VACATION')
  vacationStartDate?: string;
  vacationEndDate?: string;
  totalDays?: number;

  createdBy?: Types.ObjectId;
};
