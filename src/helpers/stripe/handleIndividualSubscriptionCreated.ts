
import Stripe from 'stripe';
import { User } from '../../app/modules/user/user.model';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { emailTemplate } from '../../shared/emailTemplate';
import { emailHelper } from '../emailHelper';

export const handleIndividualSubscriptionCreated = async (data: Stripe.Checkout.Session) => {
    const subscription = await Subscription.findById(data.metadata?.subscriptionId);
    let currentEmployees = subscription?.totalEmployees || 0;
    const session = data as Stripe.Checkout.Session;
    if (session.payment_status !== 'paid') {
        console.log('Payment not completed, skipping...');
        return;
    }
    if (session.metadata?.userData && session.metadata?.userId) {
        const userData = JSON.parse(session.metadata.userData);
        const packagePrice = Number(session.metadata.packagePrice);
        const subscriptionId = session.metadata.subscriptionId;

        await Subscription.findByIdAndUpdate(
            subscriptionId,
            {
                $inc: {
                    price: packagePrice,
                    totalEmployees: currentEmployees + 1,
                }
            },
            { new: true },
        );

        const result = await User.create(userData);
        try {
            const createAccountTemplate = emailTemplate.employeeEmailTemplate({
                name: result.name,
                email: result.email!,
                password: '12345678',
            });
            await emailHelper.sendEmail(createAccountTemplate);
            console.log('✅ Email sent to:', result.email);
        } catch (err) {
            console.error('❌ Email sending failed:', err);
        }
        console.log('✅ Employee created after payment:', userData.email);
    }
}