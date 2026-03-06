import { z } from 'zod';
import { REQUEST_TYPE } from './shiftAndLeaveRequest.constant';

const createShiftAndLeaveRequestSchema = z.object({
  body: z.object({
    requestType: z.nativeEnum(REQUEST_TYPE, {
      required_error:
        'Request type is required and must be either SHIFT_CHANGE, or VACATION',
    }),
    reason: z.string({ required_error: 'Reason is required' }),
    decisionDate: z.string().optional(),
    currentShiftID: z.string().optional(),
    requestShiftID: z.string().optional(),
    requestedDate: z.string().optional(),
    vacationStartDate: z.string().optional(),
    vacationEndDate: z.string().optional(),
  }),
});

export const ShiftAndLeaveRequestValidation = {
  createShiftAndLeaveRequestSchema,
};
