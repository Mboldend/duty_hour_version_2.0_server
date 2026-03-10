import { JwtPayload } from 'jsonwebtoken';
import stripe from '../config/stripe';
import config from '../config';
import ApiError from '../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { Subscription } from '../app/modules/subscription/subscription.model';
import { SUBSCRIPTION_STATUS } from '../app/modules/subscription/subscription.constant';
import { User } from '../app/modules/user/user.model';
import { emailTemplate } from '../shared/emailTemplate';
import { emailHelper } from './emailHelper';

export const ProgramForBulkUserCreation = async (
  payload: any,
  user: JwtPayload,
) => {
  const subscription = await Subscription.findOne({
    userId: user.id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  })
    .populate('packageId', 'planName price person')
    .lean();

  if (!subscription) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No active subscription found');
  }

  const packageDetails = (subscription as any)?.packageId;
  const packageLimit = packageDetails?.person;
  const remainingEmployees = subscription?.totalEmployees ?? 0;

  // If no seats left → need payment
  if (remainingEmployees <= 0) {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: packageDetails.planName,
            },
            unit_amount: packageDetails.price * 100,
          },
          quantity: 1,
        },
      ],
      success_url:
        config.stripe.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK!,
      cancel_url:
        config.stripe.BULK_EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed!,
      metadata: {
        userId: user.id,
        packageId: (subscription as any).packageId._id.toString(),
        packageName: packageDetails.planName,
        employeeData: JSON.stringify(payload),
        subscriptionId: (subscription as any)._id.toString(),
        packageType: "program"
      },
    });


    return {
      status: 'PAYMENT_REQUIRED',
      paymentUrl: session.url,
      message: `Employee limit finished (${packageLimit}). Please pay to add more employees.`,
    };
  }

  // Create employee
  const userData = {
    ...payload,
    verified: true,
    createdBy: user.id,
  };

  const newEmployee = await User.create(userData);

  // Send email
  const createAccountTemplate = emailTemplate.employeeEmailTemplate({
    name: newEmployee.name,
    email: newEmployee.email!,
    password: payload.password || '12345678',
  });

  try {
    await emailHelper.sendEmail(createAccountTemplate);
    console.log('✅ Email sent to:', newEmployee.email);
  } catch (err) {
    console.error('❌ Email sending failed:', err);
  }

  // Decrease remaining seats by 1
  await Subscription.findOneAndUpdate(
    {
      userId: user.id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      totalEmployees: { $gt: 0 }, // prevent negative
    },
    {
      $inc: { totalEmployees: -1 },
    },
    { new: true }
  );

  return {
    status: 'EMPLOYEE_CREATED',
    message: `Employee created successfully. Remaining seats: ${remainingEmployees - 1
      }/${packageLimit}`,
    data: newEmployee,
  };
};