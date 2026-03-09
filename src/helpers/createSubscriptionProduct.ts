import { StatusCodes } from "http-status-codes";
import stripe from "../config/stripe";
import config from "../config";
import { IPackage } from "../app/modules/package/package.interface";
import ApiError from "../errors/ApiError";

export const createSubscriptionProduct = async (payload: Partial<IPackage>): Promise<{ productId: string; paymentLink: string, priceId: string } | null> => {

    // Create Product in Stripe
    const product = await stripe.products.create({
        name: payload.planName as string
    });

    let interval: 'month' | 'year' = 'month'; // Default to 'month'
    let intervalCount = 1; // Default to every 1 month

    // Map duration to interval_count
    switch (payload.billingCycle!.toLowerCase()) {
        case 'monthly':
            interval = 'month';
            intervalCount = 1;
            break;
        case 'yearly':
            interval = 'year';
            intervalCount = 1;
            break;
        default:
            interval = 'month';
            intervalCount = 1; // Defaults to 1 month if duration is not specified
    }


    // Create Price for the Product
    const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Number(payload.price) * 100, // in cents
        currency: 'eur', //currency
        
        recurring: { interval, interval_count: intervalCount },
    });

    if (!price) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to create price for the subscription product.'
        );
    }

    // Create a Payment Link
    const paymentLink = await stripe.paymentLinks.create({
        line_items: [
            {
                price: price.id,
                quantity: 1,
            },
        ],
        after_completion: {
            type: 'redirect',
            redirect: {
                url: `${config.stripe.paymentSuccess}`, // Redirect URL on successful payment
            },
        },

        metadata: {
            productId: product.id,
            priceId: price.id,
        },
    });
    


    if (!paymentLink.url) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            'Failed to create payment link for the subscription product.'
        );
    }
    return { productId: product.id, priceId: price.id, paymentLink: paymentLink.url };
};
