// utils/date.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

/**
 * Takes 'YYYY-MM-DD' string, returns UTC ISO string like '2025-07-01T00:00:00Z'
 */
export const toUTCISOString = (dateStr: string): string => {
  return dayjs.utc(dateStr, 'YYYY-MM-DD').startOf('day').toISOString();
};
