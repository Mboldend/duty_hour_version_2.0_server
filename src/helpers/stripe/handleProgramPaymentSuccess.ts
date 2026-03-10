import { StatusCodes } from 'http-status-codes';
import { User } from '../../app/modules/user/user.model';
import ApiError from '../../errors/ApiError';
import { emailTemplate } from '../../shared/emailTemplate';
import { emailHelper } from '../emailHelper';

const handleProgramPaymentSuccess = async (
  employeeData: any,
  userId: string,
  subscriptionId: string,
) => {
  try {
    // Create employee (user already paid for this seat when totalEmployees was 0)
    const result = await User.create({
      ...employeeData,
      verified: true,
      createdBy: userId,
    });

    // Send email
    const template = emailTemplate.employeeEmailTemplate({
      name: result.name,
      email: result.email!,
      password: employeeData.password || '12345678',
    });

    try {
      await emailHelper.sendEmail(template);
      console.log(' Email sent to:', result.email);
    } catch (err) {
      console.error(' Email sending failed:', err);
    }

    console.log(' Program employee created:', result._id);
    return result;
  } catch (error) {
    console.error(' Failed to create program employee:', error);
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create employee after payment',
    );
  }
};

export default handleProgramPaymentSuccess;
