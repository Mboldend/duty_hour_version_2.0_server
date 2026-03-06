import Stripe from 'stripe';
import { deactivateSubscriptionByStripeId } from '../../app/modules/subscription/subscription.utility';

export const handleSubscriptionDeleted = async (data: Stripe.Subscription) => {
  try {
    await deactivateSubscriptionByStripeId(data.id);
  } catch (error) {
    console.error('Error in handleSubscriptionDeleted:', error);
    throw error;
  }
};
