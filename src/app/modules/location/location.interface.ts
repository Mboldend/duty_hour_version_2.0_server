import { Schema, Types } from 'mongoose';
import { STATUS } from '../../../shared/constant';

export interface ILocation {
  locationName: string;
  latitude?: number;
  longitude?: number;
  wifiSSID: string;
  wifiIPAddress: string;
  institutionID: Types.ObjectId;
  radius?: number; //in meters
  status: STATUS;
  createdBy: Schema.Types.ObjectId;
}
