import catchAsync from '../../../shared/catchAsync';
import { emailHelper } from '../../../helpers/emailHelper';

const createContact = catchAsync(async (req, res) => {
  const { firstName, lastName, email, phone, subject, message } = req.body;

  await emailHelper.sendContactMessage({
    firstName,
    lastName,
    email,
    phone,
    subject,
    message,
  });

  res.status(200).json({
    success: true,
    message: 'Your message has been sent successfully!',
  });
});

export const ContactControllers = {
  createContact,
};
