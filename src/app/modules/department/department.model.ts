import { Schema, model } from 'mongoose';
import { IDepartment } from './department.interface';
import { STATUS } from '../../../shared/constant';

const departmentSchema = new Schema<IDepartment>(
  {
    departmentName: {
      type: String,
      required: true,
      trim: true,
    },
    institutionID: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    totalEmployee: {
      type: Number,
      default: 0,
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

export const Department = model<IDepartment>('Department', departmentSchema);
