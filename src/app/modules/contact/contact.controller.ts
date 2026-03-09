import catchAsync from '../../../shared/catchAsync';
import { emailHelper } from '../../../helpers/emailHelper';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { Request, Response } from 'express';

const createContact = catchAsync(async (req: Request, res: Response) => {
  await emailHelper.sendContactMessage(req.body);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Your message has been sent successfully!',
  });
});

export const ContactControllers = {
  createContact,
};
