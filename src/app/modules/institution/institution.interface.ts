import { Types } from 'mongoose';
import { STATUS } from '../../../shared/constant';

export type TInstitution = {
  institutionName: string;
  address: string;
  email: string;
  phoneNumber: string;
  institutionWebsiteLink: string;
  establishedYear: number;
  logo: string;
  status?: STATUS;
  owner: Types.ObjectId;
  createdAt?: string;
  updatedAt?: string;
};
