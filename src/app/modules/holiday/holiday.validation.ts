import { z } from 'zod';
import { HOLIDAY_TYPE } from './holiday.constant';

const createHolidayValidationSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }),
    startDate: z.string({ required_error: 'Start date is required' }),
    endDate: z.string({ required_error: 'End date is required' }),
    institutionID: z.string({ required_error: 'Institution ID is required' }),
    holidayType: z.nativeEnum(HOLIDAY_TYPE, {
      required_error: "Holiday type mustbe 'OFFICE' or 'GOVERNMENT'",
    }),
  }),
});

export const HolidayValidation = {
  createHolidayValidationSchema,
};
