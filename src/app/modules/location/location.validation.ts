import { z } from 'zod';

const createLocationValidationSchema = z.object({
  body: z.object({
    locationName: z.string({ required_error: 'Location name is required' }),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    wifiSSID: z.string({ required_error: 'Wifi SSID is required' }),
    wifiIPAddress: z.string({ required_error: 'Wifi IP address is required' }),
    institutionID: z.string({ required_error: 'Institution ID is required' }),
    radius: z.number().optional(),
  }),
});

export const LocationValidation = {
  createLocationValidationSchema,
};
