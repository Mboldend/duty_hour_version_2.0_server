import { JwtPayload } from "jsonwebtoken";
import stripe from "../config/stripe";
import { Package } from "../app/modules/package/package.model";
import config from "../config";

export const ProgramForBulkUserCreation = async (payload: any, user: JwtPayload) => {

    const packageDetails = await Package.findById(payload.packageId).lean();
    if (!packageDetails) {
        throw new Error('Package not found');
    }
    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: packageDetails.planName
                    },
                    unit_amount: packageDetails.price * 100,
                },
                quantity: 1,
            }
        ],
        success_url: config.stripe.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK!,
        cancel_url: config.stripe.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed!,
        metadata: {
            user: user.id,
            packageId: payload.packageId,
            packageName: packageDetails.planName,
            totalEmployees: payload.totalEmployees,
        },
    });

    return {
        paymentUrl: session.url
    };

}