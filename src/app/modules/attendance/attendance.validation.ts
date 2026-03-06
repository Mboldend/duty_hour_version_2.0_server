import { z } from 'zod';

const attendanceValidationSchema = z.object({
  body: z.object({
    wifiIPAddress: z.string({ required_error: 'Wifi IP address is required' }),
    wifiSSID: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
  }),
});

export const AttendanceValidation = {
  attendanceValidationSchema,
};
