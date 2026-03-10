import Stripe from 'stripe';
import stripe from '../config/stripe';
import { User } from '../app/modules/user/user.model';
import handleIndividualPaymentSuccess from './stripe/handleIndividualPaymentSuccess';
import handleProgramPaymentSuccess from './stripe/handleProgramPaymentSuccess';
import { Subscription } from '../app/modules/subscription/subscription.model';

export const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent,
) => {
  console.log('paymentIntent\n\n\n', 'paymentIntent');
  console.log('customerId\n\n\n', paymentIntent.customer);
  const trxId = paymentIntent.id;
  console.log(trxId, 'trxId');
  try {
    const customerId = paymentIntent.customer;
    if (!customerId || typeof customerId !== 'string') {
      console.error('❌ Customer ID missing in payment intent');
      return;
    }
    // Get customer from Stripe
    const customer = (await stripe.customers.retrieve(customerId)) as any;

    if (!customer.email) {
      console.error('❌ Customer email not found in Stripe');
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: customer.email }).lean();
    if (!user) {
      console.error('❌ User not found for email:', customer.email);
      return;
    }

    // Extract metadata
    const metadata = paymentIntent.metadata || {};
    const packageType = metadata.packageType;
    const employeeDataStr = metadata.employeeData;
    const subscriptionId = metadata.subscriptionId;
    const userId = metadata.userId;

    // Check if all required metadata exists
    if (!employeeDataStr || !subscriptionId || !userId) {
      console.log(
        '⚠️ No employee data or subscription in metadata - skipping employee creation',
      );
      return;
    }

    // Parse employee data
    let employeeData;
    try {
      employeeData = JSON.parse(employeeDataStr);
    } catch (error) {
      console.error('❌ Failed to parse employee data from metadata');
      return;
    }

    // Route to appropriate handler based on package type
    if (packageType === 'individual') {
      await handleIndividualPaymentSuccess(
        employeeData,
        userId,
        subscriptionId,
      );
    } else if (packageType === 'program') {
      console.log('📦 Processing program package payment...');
      await handleProgramPaymentSuccess(employeeData, userId, subscriptionId);
    } else {
      console.warn('⚠️ Unknown package type:', packageType);
      return;
    }
    // Save transaction ID to subscription
    await Subscription.findByIdAndUpdate(
      subscriptionId,
      { trxId },
      { new: true },
    );
  } catch (error) {
    console.error('❌ handlePaymentIntentSucceeded error:', error);
  }
};
