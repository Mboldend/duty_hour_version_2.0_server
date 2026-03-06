import { Schema, Types } from 'mongoose';
import { STATUS } from '../../../shared/constant';

export interface IDepartment {
  departmentName: string;
  institutionID: Types.ObjectId;
  totalEmployee: number;
  status: STATUS;
  createdBy: Schema.Types.ObjectId;
}
