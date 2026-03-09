import { Types } from 'mongoose';
import { STATUS } from '../../../shared/constant';

export type TDesignation = {
  designationName: string;
  institutionID: Types.ObjectId;
  departmentID: Types.ObjectId;
  status: STATUS;
  createdBy: Types.ObjectId;
};
