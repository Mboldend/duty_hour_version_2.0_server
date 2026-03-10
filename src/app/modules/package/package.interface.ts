import { Types } from 'mongoose';
import { BILLING_CYCLE } from './package.constant';

export type IPackage = {
  planName: string;
  isUnionized: boolean;
  billingCycle: BILLING_CYCLE;
  price: number;
  packageStatus: boolean;
  person: number;
  packageType: 'individual' | 'program';
  paymentLink?: string;
  isAdmin: Types.ObjectId;
  stripeProductId?: string;
  stripePriceId?: string;
};
