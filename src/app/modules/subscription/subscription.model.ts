import { model, Schema } from 'mongoose';
import { TSubscription } from './subscription.interface';
import { SUBSCRIPTION_STATUS } from './subscription.constant';

const subscriptionSchema = new Schema<TSubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    subscriptionId: {
      type: String,
      required: true,
    },
    packageId: {
      type: Schema.Types.ObjectId,
      ref: 'Package',
      required: true,
    },
    price: {
      type: Number,
    },
    totalEmployees: {
      type: Number,
    },
    pricePerEmployee: {
      type: Number,
    },
    trxId: {
      type: String,
    },
    status: {
      type: String,
      enum: Object.values(SUBSCRIPTION_STATUS),
    },
    currentPeriodStart: {
      type: String,
    },
    currentPeriodEnd: {
      type: String,
    },
    cancelAt: {
      type: String,
    },
    remainingDays: {
      type: Number,
    },
    isTrial: {
      type: Boolean,
    },
    trialEnd: {
      type: String,
    },
    createdBy: {
      type: String,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export const Subscription = model('Subscription', subscriptionSchema);
