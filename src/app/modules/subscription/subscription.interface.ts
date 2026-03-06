import { Schema, Types } from 'mongoose';
import { SUBSCRIPTION_STATUS } from './subscription.constant';

export type TSubscription = {
  userId: Types.ObjectId; // Busines owner
  customerId: string; // stripe customer ID
  subscriptionId: string; // stripe subscription ID
  packageId: Types.ObjectId; // package ID
  price: number;
  pricePerEmployee: number;
  totalEmployees: number;
  trxId?: string; // transaction ID
  status: SUBSCRIPTION_STATUS;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAt?: string;
  remainingDays?: number;
  isTrial?: boolean;
  trialEnd?: string;
  createdBy?: string;
};
