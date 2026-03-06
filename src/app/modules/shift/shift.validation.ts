import { z } from 'zod';

const createShiftValidationSchema = z.object({
  body: z.object({
    shiftName: z.string({ required_error: 'Shift name is required' }),
    shiftStartTime: z.string({
      required_error: 'Shift start time is required',
    }),
    shiftEndTime: z.string({ required_error: 'Shift end time is required' }),
  }),
});

export const ShiftValidation = {
  createShiftValidationSchema,
};
