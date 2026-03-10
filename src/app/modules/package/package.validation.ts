import { z } from 'zod';
import { BILLING_CYCLE } from './package.constant';

const createPackageSchemaValidation = z.object({
  body: z.object({
    planName: z.string({
      required_error: 'Plan name is required',
    }),
    isUnionized: z.boolean({
      required_error: 'isUnionized is required',
    }),
    billingCycle: z.enum(
      Object.values(BILLING_CYCLE) as [string, ...string[]],
      {
        required_error: 'Billing cycle is required',
      },
    ),
    price: z.number({
      required_error: 'Price is required',
    }),
    isAdmin: z
      .string({
        required_error: 'Admin ID is required',
      })
      .regex(/^[0-9a-fA-F]{24}$/, 'Invalid admin ID format'),
    paymentLink: z.string().optional(),
    packageStatus: z.boolean({
      required_error: 'Package status is required',
    }),
    stripeProductId: z.string().optional(),
    stripePriceId: z.string().optional(),
  }),
});

export const PackageValidation = {
  createPackageSchemaValidation,
};
