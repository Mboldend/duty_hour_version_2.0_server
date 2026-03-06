import { model, Schema } from 'mongoose';
import { THoliday } from './holiday.interface';
import { HOLIDAY_TYPE } from './holiday.constant';
import { STATUS } from '../../../shared/constant';
import {
  excludeDeletedAggregation,
  excludeDeletedQuery,
} from '../../../util/queryFilter';

const holidaySchema = new Schema<THoliday>(
  {
    name: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
    totalDay: {
      type: Number,
    },
    institutionID: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    holidayType: {
      type: String,
      enum: Object.values(HOLIDAY_TYPE),
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
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

export const Holiday = model('Holiday', holidaySchema);
