import { z } from 'zod';

const createDepartmentValidationSchema = z.object({
  body: z.object({
    departmentName: z.string({ required_error: 'Department name is required' }),
    institutionID: z.string({ required_error: 'Institution ID is required' }),
  }),
});

export const DepartmentValidation = {
  createDepartmentValidationSchema,
};
