import Stripe from 'stripe';
import stripe from '../../config/stripe';
import { handleSubscriptionCreated } from './handleSubscriptionCreated';
import { Request, Response } from 'express';
import config from '../../config';
import { handleSubscriptionUpdated } from './handleSubscriptionUpdate';
import { handleIndividualSubscriptionCreated } from './handleIndividualSubscriptionCreated';
import { handlePaymentIntentSucceeded } from '../handlePaymentIntentSucceeded';
import { StatusCodes } from 'http-status-codes';

const WEBHOOK_SECRET = config.stripe.stripe_webhook_secret!;

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string | undefined;

  if (!signature) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send('Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res
      .status(StatusCodes.BAD_REQUEST)
      .send(`Webhook error: ${(err as Error).message}`);
  }

  const data = event.data.object;

  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(data as Stripe.Subscription);
        break;
      case 'checkout.session.completed': {
        await handleIndividualSubscriptionCreated(
          data as Stripe.Checkout.Session,
        );
        break;
      }
      case 'payment_intent.succeeded': {
        await handlePaymentIntentSucceeded(data as Stripe.PaymentIntent);
        break;
      }

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(data as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .send(`Error handling webhook: ${(error as Error).message}`);
  }

  res.status(StatusCodes.OK).send('Webhook received');
};
