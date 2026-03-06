import { Schema, Types } from 'mongoose';
import { STATUS } from '../../../shared/constant';
import { HOLIDAY_TYPE } from './holiday.constant';

export type THoliday = {
  name: string;
  startDate: string;
  endDate: string;
  totalDay?: number;
  institutionID: Schema.Types.ObjectId;
  holidayType: HOLIDAY_TYPE;
  status: STATUS;
  createdBy: Types.ObjectId;
};
