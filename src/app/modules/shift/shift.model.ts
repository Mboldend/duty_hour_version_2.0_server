import { model, Schema } from 'mongoose';
import { TShift } from './shift.interface';
import { STATUS } from '../../../shared/constant';

const shiftSchema = new Schema<TShift>(
  {
    shiftName: {
      type: String,
      required: true,
    },
    shiftStartTime: {
      type: String,
      required: true,
    },
    shiftEndTime: {
      type: String,
      required: true,
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

export const Shift = model('Shift', shiftSchema);
