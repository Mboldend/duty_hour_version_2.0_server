import Stripe from 'stripe';
import { User } from '../../app/modules/user/user.model';
import ApiError from '../../errors/ApiError';
import stripe from '../../config/stripe';
import { Package } from '../../app/modules/package/package.model';

import { SUBSCRIPTION_STATUS } from '../../app/modules/subscription/subscription.constant';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { Types } from 'mongoose';
import { sendNotifications } from '../notificationHelper';
import { StatusCodes } from 'http-status-codes';
import { STATUS } from '../../shared/constant';
import { USER_ROLES } from '../../enums/user';
import { logger } from '../../shared/logger';

export const formatUnixToIsoUtc = (timestamp?: number): string => {
  if (!timestamp || isNaN(timestamp)) {
    throw new Error('Invalid timestamp passed to formatUnixToIsoUtc');
  }
  return new Date(timestamp * 1000).toISOString().replace('Z', '+00:00');
};

export const handleSubscriptionCreated = async (
  subscriptionData: Stripe.Subscription,
) => {
  // const getBusinessOwner = await User.findOne({
  //   role: USER_ROLES.BUSINESS_OWNER,
  // });
  // if (!getBusinessOwner) {
  //   throw new ApiError(StatusCodes.NOT_FOUND, 'Admin not found!');
  // }
  const subscription = (await stripe.subscriptions.retrieve(
    subscriptionData.id,
  )) as any;

  const customer = (await stripe.customers.retrieve(
    subscription.customer,
  )) as any;

  if (!customer.email) throw new ApiError(400, 'Customer email not found');

  const user = await User.findOne({ email: customer.email }).lean();
  if (!user) return {
    success: false,
    status: StatusCodes.NOT_FOUND,
    message: 'User not found for the given customer email',
  };
  // if (user.role !== USER_ROLES.BUSINESS_OWNER)
  //   throw new ApiError(403, 'Only business owners allowed');

  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    return {
      success: false,
      status: StatusCodes.BAD_REQUEST,
      message: 'Price ID not found in subscription items',
    };
  };

  const pkg = await Package.findOne({ stripePriceId: priceId });
  if (!pkg) return {
    success: false,
    status: StatusCodes.NOT_FOUND,
    message: 'Package not found',
  };

  // already handled subscription (idempotent check)
  const existingStripeSub = await Subscription.findOne({
    subscriptionId: subscription.id,
  });
  if (existingStripeSub) {
    console.log('⚠️ Duplicate subscription detected. Skipping DB write.');
    return;
  }

  // active subscription check (business rule)
  const existingSub = await Subscription.findOne({
    userId: user._id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });
  if (existingSub) {
    return {
      success: false,
      status: StatusCodes.CONFLICT,
      message: 'User already has an active subscription',
    }
  }

  const totalEmployees = subscription.items.data[0]?.quantity || 0;
  const pricePerEmployee = pkg.price || 0;
  const amountPaid = pricePerEmployee * totalEmployees;

  const currentPeriodStart = subscription.items.data[0]?.current_period_start;
  const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

  if (!currentPeriodStart || !currentPeriodEnd) {
    return {
      success: false,
      status: StatusCodes.BAD_REQUEST,
      message: 'Current period start/end not found in subscription items',
    };
  }

  const now = Date.now();
  const periodEnd = currentPeriodEnd * 1000;
  const remainingDays = Math.max(
    Math.ceil((periodEnd - now) / (1000 * 60 * 60 * 24)),
    0,
  );

  const newSub = new Subscription({
    userId: user._id,
    customerId: customer.id,
    packageId: pkg._id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
    totalEmployees: totalEmployees,
    remainingDays,
    price: amountPaid,
    currentPeriodStart: formatUnixToIsoUtc(currentPeriodStart),
    currentPeriodEnd: formatUnixToIsoUtc(currentPeriodEnd),
    subscriptionId: subscription.id,
  });
  // const userUpdate = await User.findByIdAndUpdate(
  //   user._id,
  //   {
  //     isSubscribed: true,
  //     hasAccess: true,
  //     packageName: pkg.planName,
  //   },
  //   { new: true },
  // );

  try {
    await newSub.save();
    logger.info(`Subscription ${subscription.id} saved for user ${user.email}`);
  } catch (err) {
    logger.error('Failed to save subscription:', err);
    throw err;
  }

  await User.findByIdAndUpdate(
    user._id,
    {
      isSubscribed: true,
      hasAccess: true,
      packageName: pkg.planName,
    },
    { new: true },
  );

  // send notification for business owner
  await sendNotifications({
    title: `New Subscription Purchased`,
    receiver: user._id,
    message: `A new subscription has been purchased.`,
    type: 'BUSINESS_OWNER',
  });

  // send notification for super admin
  const superAdminUsers = await User.find({ role: USER_ROLES.SUPER_ADMIN });
  for (const admin of superAdminUsers) {
    await sendNotifications({
      title: 'New Subscription Purchased',
      receiver: admin._id,
      message: `Subscription purchased by ${user.name} (${user.email})`,
      type: 'SUPER_ADMIN',
    });
  }
};

export const findActiveSubscriptionWithRetry = async (
  userId: Types.ObjectId,
  customerId: string,
  maxRetries = 3,
  delayMs = 1000,
) => {
  for (let i = 0; i < maxRetries; i++) {


  

    const sub = await Subscription.findOne({
      userId,
      customerId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
    }).sort({ createdAt: -1 });


    await new Promise(res => setTimeout(res, delayMs));
  }

  return null;
};
