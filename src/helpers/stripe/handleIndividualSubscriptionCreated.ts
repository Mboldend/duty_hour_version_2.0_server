import Stripe from 'stripe';
import { User } from '../../app/modules/user/user.model';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { emailTemplate } from '../../shared/emailTemplate';
import { emailHelper } from '../emailHelper';

export const handleIndividualSubscriptionCreated = async (
  session: Stripe.Checkout.Session,
) => {
  try {
    // Extract metadata
    const subscriptionId = session.metadata?.subscriptionId;
    const userId = session.metadata?.user;
    const employeeData = JSON.parse(session.metadata?.employeeData || '{}');
    const packagePrice = Number(session.metadata?.packagePrice || 0);

    if (!subscriptionId || !userId) {
      console.error('❌ Missing subscriptionId or userId in metadata');
      return;
    }

    // Find subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      console.error('❌ Subscription not found:', subscriptionId);
      return;
    }

    // Payment check
    if (session.payment_status !== 'paid') {
      console.log('Payment not completed, skipping employee creation...');
      return;
    }

    // Prevent duplicate employee
    const userExists = await User.findOne({ email: employeeData.email });
    if (userExists) {
      console.log(
        '⚠️ Employee already exists, skipping creation:',
        employeeData.email,
      );
      return;
    }

    // Create employee
    const newEmployee = await User.create({
      ...employeeData,
      verified: true,
      createdBy: userId,
    });

    // Send email to employee
    try {
      const template = emailTemplate.employeeEmailTemplate({
        name: newEmployee.name,
        email: newEmployee.email!,
        password: employeeData.password || '12345678',
      });
      await emailHelper.sendEmail(template);
      console.log('✅ Email sent to:', newEmployee.email);
    } catch (err) {
      console.error('❌ Email sending failed:', err);
    }

    // Update subscription totalEmployees
    if (subscription.totalEmployees > 0) {
      // seats available → decrement
      await Subscription.findByIdAndUpdate(subscriptionId, {
        $inc: { totalEmployees: -1 },
      });
    } else {
      // seats 0 → paid extra → increment price
      await Subscription.findByIdAndUpdate(subscriptionId, {
        $inc: { price: packagePrice },
      });
    }

    console.log(
      '✅ Employee created successfully after payment:',
      newEmployee.email,
    );
  } catch (err) {
    console.error('❌ handleIndividualSubscriptionCreated failed:', err);
  }
};
