import { z } from 'zod';

const createDesignationValidationSchema = z.object({
  body: z.object({
    designationName: z.string({
      required_error: 'Designation name is required',
    }),
    institutionID: z.string({ required_error: 'Institution ID is required' }),
    departmentID: z.string({ required_error: 'Department ID is required' }),
  }),
});

export const DesignationValidation = {
  createDesignationValidationSchema,
};
