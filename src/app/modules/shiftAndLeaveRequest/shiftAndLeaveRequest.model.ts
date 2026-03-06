import { model, Schema } from 'mongoose';
import { TShiftAndLeaveRequest } from './shiftAndLeaveRequest.interface';
import { REQUEST_STATUS, REQUEST_TYPE } from './shiftAndLeaveRequest.constant';

const shiftAndLeaveRequestSchema = new Schema<TShiftAndLeaveRequest>(
  {
    requestType: {
      type: String,
      enum: Object.values(REQUEST_TYPE),
    },
    userID: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    // common fields
    reason: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(REQUEST_STATUS),
      default: REQUEST_STATUS.PENDING,
    },
    decisionDate: {
      type: String,
    },

    // shift-specific (if requestType === 'SHIFT_CHANGE')
    currentShiftID: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    },
    requestedShiftID: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    },
    requestedDate: {
      type: String,
    },

    // vacation-specific (if requestType === 'VACATION')
    vacationStartDate: {
      type: String,
    },
    vacationEndDate: {
      type: String,
    },
    totalDays: {
      type: Number,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const ShiftAndLeaveRequest = model(
  'ShiftAndLeaveRequest',
  shiftAndLeaveRequestSchema,
);
