import { StatusCodes } from 'http-status-codes';
import { Subscription } from '../../app/modules/subscription/subscription.model';
import { User } from '../../app/modules/user/user.model';
import ApiError from '../../errors/ApiError';
import { emailTemplate } from '../../shared/emailTemplate';
import { emailHelper } from '../emailHelper';

const handleIndividualPaymentSuccess = async (
  employeeData: any,
  userId: string,
  subscriptionId: string,
) => {
  try {
    // Create employee
    const result = await User.create({
      ...employeeData,
      verified: true,
      createdBy: userId,
    });

    // Increment totalEmployees for individual package
    await Subscription.findByIdAndUpdate(
      subscriptionId,
      { $inc: { totalEmployees: 1 } },
      { new: true },
    );

    // Send email
    const template = emailTemplate.employeeEmailTemplate({
      name: result.name,
      email: result.email!,
      password: employeeData.password || '12345678',
    });

    try {
      await emailHelper.sendEmail(template);
      console.log('✅ Email sent to:', result.email);
    } catch (err) {
      console.error('❌ Email sending failed:', err);
    }

    console.log('✅ Individual employee created:', result._id);
    return result;
  } catch (error) {
    console.error('❌ Failed to create individual employee:', error);
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create employee after payment',
    );
  }
};

export default handleIndividualPaymentSuccess;
