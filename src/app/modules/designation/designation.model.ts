import { Schema, model } from 'mongoose';

import { STATUS } from '../../../shared/constant';
import { TDesignaton } from './designation.interface';

const designationSchema = new Schema<TDesignaton>(
  {
    designationName: {
      type: String,
      required: true,
      trim: true,
    },
    institutionID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Institution',
    },
    departmentID: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Department',
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

export const Designation = model<TDesignaton>('Designation', designationSchema);
