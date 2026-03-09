import { model, Schema } from 'mongoose';
import { IPackage } from './package.interface';
import {
  BILLING_CYCLE,
} from './package.constant';

const packageSchema = new Schema<IPackage>(
  {
    planName: {
      type: String,
      required: true,
    },
    billingCycle: {
      type: String,
      enum: Object.values(BILLING_CYCLE),
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    isUnionized: {
      type: Boolean,
      required: true,
    },
    packageStatus: {
      type: Boolean,
      required: true,
      default: true,
    },
    person: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    packageType: {
      type: String,
      enum: ['individual', 'program'],
      required: true,
    },
    isAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    paymentLink: {
      type: String,
    },
    stripePriceId: {
      type: String,
    },
    stripeProductId: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

export const Package = model('Package', packageSchema);
