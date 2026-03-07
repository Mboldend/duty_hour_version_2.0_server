import { StatusCodes } from 'http-status-codes';
import ApiError from '../../../errors/ApiError';
import { User } from '../user/user.model';
import { Package } from '../package/package.model';
import stripe from '../../../config/stripe';
import { SUBSCRIPTION_STATUS } from './subscription.constant';
import { Subscription } from './subscription.model';
import { deactivateSubscriptionByStripeId } from './subscription.utility';
import { CronJob } from 'cron';
import { USER_ROLES } from '../../../enums/user';
import { JwtPayload } from 'jsonwebtoken';
import { TSubscription } from './subscription.interface';
import config from '../../../config';

const createStripeCustomerAccountToDB = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // if already customer account is exists than return
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  // create new customer account
  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user._id.toString(),
      role: user.role ?? 'Unknown',
    },
  });

  await User.findByIdAndUpdate(userId, { stripeCustomerId: customer.id });

  return customer.id;
};

const createSubscriptionCheckoutSession = async (
  userId: string,
  payload: any,
) => {
  const { packageId, totalEmployees } = payload;

  const user = await User.findById(userId);

  if (!user) throw new ApiError(404, 'User not found');
  if (user.role !== USER_ROLES.BUSINESS_OWNER)
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      'Only business owners can purchase subscription',
    );
  // check for existing active subscription
  const existingSub = await Subscription.findOne({
    userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });

  if (existingSub) {
    throw new ApiError(
      409,
      'You already have an active subscription. Please cancel it before purchasing a new one.',
    );
  }

  const pkg = await Package.findOne({ _id: packageId });
  if (!pkg) throw new ApiError(StatusCodes.NOT_FOUND, 'Package not found');
  const finalTotalEmployees = totalEmployees || 0;
  const stripeCustomerId = await createStripeCustomerAccountToDB(userId);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      {
        price: pkg.stripePriceId,
        quantity: finalTotalEmployees,
      },
    ],
    success_url: config.stripe.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK!,
    cancel_url: config.stripe.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed!,
    metadata: {
      userId: user._id.toString(),
      packageId: pkg._id.toString(),
      totalEmployees: finalTotalEmployees.toString(),
    },
  });

  return {
    url: session.url,
    sessionId: session.id,
  };
};
const handleGetBillingPortalSession = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || !user.stripeCustomerId) {
    throw new ApiError(404, 'User or Stripe Customer ID not found');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.FRONTEND_URL || 'http://frontend-url'}/subscription-success`,
  });

  return {
    url: session.url,
  };
};

const cancelSubscriptionToDB = async (userId: string) => {
  const activeSubscription = await Subscription.findOne({
    userId,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  });

  if (!activeSubscription || !activeSubscription.subscriptionId) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No active subscription found to cancel',
    );
  }

  await stripe.subscriptions.cancel(activeSubscription.subscriptionId);

  await deactivateSubscriptionByStripeId(activeSubscription.subscriptionId);

  return {
    subscriptionId: activeSubscription.subscriptionId,
  };
};

export const expireSubscriptionsJob = new CronJob(
  '* * * * *', // Time: 12:00 UTC
  async () => {

    const now = new Date().toISOString();

    const expiredSubscriptions = await Subscription.find({
      status: SUBSCRIPTION_STATUS.ACTIVE,
      currentPeriodEnd: { $lte: now },
    });

    const expiredUserIds = expiredSubscriptions.map(sub => sub.userId);

    if (expiredUserIds.length > 0) {
      // subscription expired
      await Subscription.updateMany(
        {
          userId: { $in: expiredUserIds },
          status: SUBSCRIPTION_STATUS.ACTIVE,
        },
        { status: SUBSCRIPTION_STATUS.EXPIRED },
      );

      // access false
      await User.updateMany(
        { _id: { $in: expiredUserIds } },
        {
          hasAccess: false,
          isSubscribed: false,
          packageName: '',
        },
      );

      console.log(
        `✅ ${expiredUserIds.length} subscription expired and access removed.`,
      );
    } else {
      ('⏳ No expired subscriptions found today.'); console.log
    }
  },
  null,
  false,
  'UTC', // Ensure everything in UTC time
);

expireSubscriptionsJob.start();

export const updateRemainingDaysJob = new CronJob(
  '* * * * *', // Time: 12:00
  async () => {
    const subs = await Subscription.find({
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });

    const bulkOps = subs.map(sub => {
      const now = Date.now();
      const end = new Date(sub.currentPeriodEnd).getTime();
      const days = Math.max(Math.ceil((end - now) / (1000 * 60 * 60 * 24)), 0);

      return {
        updateOne: {
          filter: { _id: sub._id },
          update: { remainingDays: days },
        },
      };
    });

    if (bulkOps.length) {
      await Subscription.bulkWrite(bulkOps);
      console.log(
        `✅ Updated remainingDays for ${bulkOps.length} subscriptions`,
      );
    } else {
      console.log('ℹ️ No subscriptions to update');
    }
  },
  null,
  false,
  'UTC',
);

updateRemainingDaysJob.start();


const subscriptionDetailsFromDB = async (user: JwtPayload): Promise<{ subscription: TSubscription | {} }> => {

  const subscription = await Subscription.findOne({ userId: user.id }).populate("packageId", "title").lean();
  if (!subscription) {
    return { subscription: {} }; // Return empty object if no subscription found
  }

  const subscriptionFromStripe = await stripe.subscriptions.retrieve(subscription.subscriptionId);

  // Check subscription status and update database accordingly
  if (subscriptionFromStripe?.status !== "active") {
    await Promise.all([
      User.findByIdAndUpdate(user.id, { isSubscribed: false }, { new: true }),
      Subscription.findOneAndUpdate({ userId: user.id }, { status: "expired" }, { new: true }),
    ]);
  }

  return { subscription };
};
const getRemainingSubscriptionFromDB = async (userId: string) => {
  const result = await Subscription.findOne({ userId: userId }).select(
    'currentPeriodStart currentPeriodEnd remainingDays status packageId',
  );
  return result;
};

export const SubscriptionServices = {
  createStripeCustomerAccountToDB,
  createSubscriptionCheckoutSession,
  // updateSubscriptionToDB,
  handleGetBillingPortalSession,
  cancelSubscriptionToDB,
  getRemainingSubscriptionFromDB,
  subscriptionDetailsFromDB
};
