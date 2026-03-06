import { Types } from 'mongoose';
import { STATUS } from '../../../shared/constant';

export type TShift = {
  shiftName: string;
  shiftStartTime: string;
  shiftEndTime: string;
  status: STATUS;
  createdBy: Types.ObjectId;
};
