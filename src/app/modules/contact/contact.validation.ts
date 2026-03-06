import { z } from 'zod';

const createContactValidationSchema = z.object({
  body: z.object({
    firstName: z.string({ required_error: 'First name is required' }),
    lastName: z.string({ required_error: 'Last name is required' }),
    email: z.string({ required_error: 'Email is required' }),
    subject: z.string({ required_error: 'Subject is required' }),
    message: z.string({ required_error: 'Message is required' }),
  }),
});

export const ContactValidation = {
  createContactValidationSchema,
};
