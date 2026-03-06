import { model, Schema, Types } from 'mongoose';
import { TAttendance } from './attendance.interface';
import { MANUAL_STATUS, STATUS } from './attendance.constant';

const attendanceSchema = new Schema<TAttendance>(
  {
    userID: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    wifiIPAddress: {
      type: String,
    },
    wifiSSID: {
      type: String,
      required: false,
    },
    latitude: {
      type: String,
      required: false,
    },
    longitude: {
      type: String,
      required: false,
    },
    institutionID: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
    },
    departmentID: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    locationID: {
      type: Schema.Types.ObjectId,
      ref: 'Location',
    },
    shiftID: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    },
    checkInTime: {
      type: Date,
      default: null,
    },
    checkOutTime: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
    },
    sessions: [
      {
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
          required: true,
        },
      },
    ],

    // new fields for manual entry
    isManual: {
      type: Boolean,
    },
    manualStatus: {
      type: String,
      enum: Object.values(MANUAL_STATUS),
    },
    manualReason: {
      type: String,
    },
    manualRequestDate: {
      type: String,
    },
    manualReviewedBy: {
      type: Types.ObjectId,
      ref: 'User',
    },
    manualReviewedAt: {
      type: Date,
    },
    manualReviewerNote: {
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Attendance = model('Attendance', attendanceSchema);
