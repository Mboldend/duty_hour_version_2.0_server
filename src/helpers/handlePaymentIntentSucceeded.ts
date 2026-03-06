import Stripe from "stripe";
import stripe from "../config/stripe";
import { User } from "../app/modules/user/user.model";
import { findActiveSubscriptionWithRetry } from "./stripe/handleSubscriptionCreated";


export const handlePaymentIntentSucceeded = async (
    paymentIntent: Stripe.PaymentIntent
) => {
    const trxId = paymentIntent.id;
    console.log(trxId, "trxId");

    const customerId = paymentIntent.customer;

    if (!customerId || typeof customerId !== "string") {
        console.error("Customer ID missing in payment intent");
        return;
    }

    // get stripe customer
    const customer = (await stripe.customers.retrieve(customerId)) as any;

    if (!customer.email) {
        console.error("Customer email not found");
        return;
    }

    const user = await User.findOne({ email: customer.email }).lean();

    if (!user) {
        console.error("User not found for email:", customer.email);
        return;
    }

    const sub = await findActiveSubscriptionWithRetry(user._id, customerId);

    if (!sub) {
        console.error("No active subscription found for user:", user._id);
        return;
    }
    // @ts-ignore
    sub.trxId = trxId;
    // @ts-ignore
    await sub.save();

    console.log("Transaction ID added to subscription:", trxId);
};