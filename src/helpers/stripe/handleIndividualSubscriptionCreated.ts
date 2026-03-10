import Stripe from 'stripe';
import { User } from '../../app/modules/user/user.model';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { emailTemplate } from '../../shared/emailTemplate';
import { emailHelper } from '../emailHelper';

export const handleIndividualSubscriptionCreated = async (
  session: Stripe.Checkout.Session,
) => {
  try {
    // Extract metadata (userId is sent by user.service & ProgramForBulkUserCreation)
    const subscriptionId = session.metadata?.subscriptionId;
    const userId = session.metadata?.userId || session.metadata?.user;
    const packageType = session.metadata?.packageType;
    const employeeDataStr = session.metadata?.employeeData;

    if (!subscriptionId || !userId) {
      console.error('❌ Missing subscriptionId or userId in metadata');
      return;
    }

    if (!employeeDataStr) {
      console.error(
        '❌ Missing employeeData in metadata - not an employee purchase',
      );
      return;
    }

    let employeeData: Record<string, unknown>;
    try {
      employeeData = JSON.parse(employeeDataStr);
    } catch {
      console.error('❌ Invalid employeeData JSON in metadata');
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
    const empEmail = (employeeData as { email?: string }).email;
    if (empEmail) {
      const userExists = await User.findOne({ email: empEmail });
      if (userExists) {
        console.log('⚠️ Employee already exists, skipping creation:', empEmail);
        return;
      }
    }

    // Create employee
    const newEmployee = await User.create({
      ...(employeeData as object),
      verified: true,
      createdBy: userId,
    });

    // Send email to employee
    try {
      const template = emailTemplate.employeeEmailTemplate({
        name: newEmployee.name,
        email: newEmployee.email!,
        password:
          (employeeData as { password?: string }).password || '12345678',
      });
      await emailHelper.sendEmail(template);
      console.log('✅ Email sent to:', newEmployee.email);
    } catch (err) {
      console.error('❌ Email sending failed:', err);
    }

    // Update subscription: totalEmployees for individual, trxId for both
    const trxId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id;
    const updatePayload: Record<string, unknown> = {};
    if (trxId) updatePayload.trxId = trxId;
    if (packageType === 'individual') {
      updatePayload.$inc = { totalEmployees: 1 };
    }
    if (Object.keys(updatePayload).length > 0) {
      await Subscription.findByIdAndUpdate(subscriptionId, updatePayload);
    }

    console.log(
      '✅ Employee created successfully after payment:',
      newEmployee.email,
    );
  } catch (err) {
    console.error('❌ handleIndividualSubscriptionCreated failed:', err);
  }
};
