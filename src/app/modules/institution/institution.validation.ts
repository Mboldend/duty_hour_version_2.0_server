import { z } from 'zod';

const createInstitutionValidationSchema = z.object({
  body: z.object({
    institutionName: z.string({
      required_error: 'Institution Name is required',
    }),
    address: z.string({ required_error: 'Address is required' }),
    email: z.string({ required_error: 'Email is required' }),
    phoneNumber: z.string({ required_error: 'Phone number is required' }),
    institutionWebsiteLink: z.string({
      required_error: 'Institution website link is required',
    }),
    establishedYear: z.coerce.number({
      required_error: 'Established year is required',
    }),
  }),
});

export const InstitutionValidation = {
  createInstitutionValidationSchema,
};
