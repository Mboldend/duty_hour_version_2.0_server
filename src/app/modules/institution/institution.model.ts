import { model, Schema } from 'mongoose';
import { TInstitution } from './institution.interface';
import { STATUS } from '../../../shared/constant';

const institutionSchema = new Schema<TInstitution>(
  {
    institutionName: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    institutionWebsiteLink: {
      type: String,
      required: true,
    },
    establishedYear: {
      type: Number,
      required: true,
    },
    logo: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Institution = model<TInstitution>(
  'Institution',
  institutionSchema,
);
