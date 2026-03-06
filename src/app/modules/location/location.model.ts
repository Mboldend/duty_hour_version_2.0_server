import { Schema, model } from 'mongoose';
import { ILocation } from './location.interface';
import { STATUS } from '../../../shared/constant';

const locationSchema = new Schema<ILocation>(
  {
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    wifiSSID: {
      type: String,
      required: true,
    },
    wifiIPAddress: {
      type: String,
      required: true,
    },
    institutionID: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
      required: true,
    },
    radius: {
      type: Number,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Location = model<ILocation>('Location', locationSchema);
