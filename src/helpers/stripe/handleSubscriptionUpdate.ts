import Stripe from 'stripe';
import stripe from '../../config/stripe';
import { formatUnixToIsoUtc } from './handleSubscriptionCreated';
import ApiError from '../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { User } from '../../app/modules/user/user.model';
import { Package } from '../../app/modules/package/package.model';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { SUBSCRIPTION_STATUS } from '../../app/modules/subscription/subscription.constant';
import { sendNotifications } from '../notificationHelper';
import { USER_ROLES } from '../../enums/user';

const calculateRemainingDays = (unixTimestamp: number | undefined): number => {
  if (!unixTimestamp) return 0;
  const now = new Date();
  const periodEnd = new Date(unixTimestamp * 1000); // Unix timestamp to Date
  if (periodEnd <= now) return 0;
  return Math.ceil(
    (periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
};

export const handleSubscriptionUpdated = async (data: Stripe.Subscription) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(data.id);

    const customer = (await stripe.customers.retrieve(
      subscription.customer as string,
    )) as Stripe.Customer;

    const priceId = subscription.items.data[0]?.price?.id;
    const employeeCount = subscription.items.data[0]?.quantity || 0;

    const currentPeriodStart = subscription.items.data[0]?.current_period_start;
    const currentPeriodEnd = subscription.items.data[0]?.current_period_end;

    const subscriptionId = subscription.id;

    if (!customer?.email) {
      throw new ApiError(400, 'No email found for the customer!');
    }

    const existingUser = await User.findOne({ email: customer.email });
    if (!existingUser) {
      throw new ApiError(404, `User not found for email: ${customer.email}`);
    }

    const pricingPlan = await Package.findOne({ stripePriceId: priceId });
    if (!pricingPlan) {
      throw new ApiError(
        404,
        `Pricing plan with Price ID: ${priceId} not found!`,
      );
    }
    let trxId: string | null = null;
    if (subscription.latest_invoice) {
      const invoice = (await stripe.invoices.retrieve(
        subscription.latest_invoice as string,
      )) as any;
      if (invoice.payment_intent) {
        trxId =
          typeof invoice.payment_intent === 'string'
            ? invoice.payment_intent
            : invoice.payment_intent.id;
      }
    }

    const currentActiveSubscription = await Subscription.findOne({
      userId: existingUser._id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
    });

    const remainingDays = calculateRemainingDays(currentPeriodEnd);
    console.log(remainingDays, 'Remaining Days');

    if (currentActiveSubscription) {
      if (
        String(currentActiveSubscription.packageId) !== String(pricingPlan._id)
      ) {
  
        await Subscription.findByIdAndUpdate(currentActiveSubscription._id, {
          status: SUBSCRIPTION_STATUS.INACTIVE,
          remainingDays: 0,
          currentPeriodEnd: null,
          currentPeriodStart: null,
        });

        const newSubscription = new Subscription({
          userId: existingUser._id,
          customerId: customer.id,
          packageId: pricingPlan._id,
          // @ts-ignore
          pricePerEmployee: pricingPlan.pricePerEmployee,
          totalEmployees: employeeCount,
          // @ts-ignore
          price: pricingPlan.pricePerEmployee * employeeCount,
          trxId,
          subscriptionId,
          currentPeriodStart: formatUnixToIsoUtc(currentPeriodStart),
          currentPeriodEnd: formatUnixToIsoUtc(currentPeriodEnd),
          remainingDays: remainingDays,
          status: SUBSCRIPTION_STATUS.ACTIVE,
        });

        await newSubscription.save();
      } else {
        currentActiveSubscription.totalEmployees = employeeCount;
        currentActiveSubscription.price =
         // @ts-ignore
          pricingPlan.pricePerEmployee * employeeCount;
        currentActiveSubscription.currentPeriodStart =
          formatUnixToIsoUtc(currentPeriodStart);
        currentActiveSubscription.currentPeriodEnd =
          formatUnixToIsoUtc(currentPeriodEnd);
        // currentActiveSubscription.remainingDays = remainingDays;

        // if (trxId) {
        //   currentActiveSubscription.trxId = trxId;
        // }

        currentActiveSubscription.trxId =
          trxId || currentActiveSubscription.trxId;

        await currentActiveSubscription.save();

        // send notification for business owner
        await sendNotifications({
          title: `${existingUser.name}`,
          receiver: existingUser._id,
          message: `Your subscription has been updated successfully.`,
          type: 'BUSINESS_OWNER',
        });

        // send notification for super admin
        const superAdmins = await User.find({ role: USER_ROLES.SUPER_ADMIN });
        for (const admin of superAdmins) {
          await sendNotifications({
            title: 'Subscription Updated',
            receiver: admin._id,
            message: `Subscription updated for ${existingUser.name} (${existingUser.email})`,
            type: 'SUPER_ADMIN',
          });
        }
      }
    } else {

      const newSubscription = new Subscription({
        userId: existingUser._id,
        customerId: customer.id,
        packageId: pricingPlan._id,
        // @ts-ignore
        pricePerEmployee: pricingPlan.pricePerEmployee,
        totalEmployees: employeeCount,
        // @ts-ignore
        price: pricingPlan.pricePerEmployee * employeeCount,
        trxId,
        subscriptionId,
        currentPeriodStart: formatUnixToIsoUtc(currentPeriodStart),
        currentPeriodEnd: formatUnixToIsoUtc(currentPeriodEnd),
        remainingDays: remainingDays,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      });

      await newSubscription.save();
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    } else {
      throw new ApiError(500, 'Error updating subscription status');
    }
  }
};
