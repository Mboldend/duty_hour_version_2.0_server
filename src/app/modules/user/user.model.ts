import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { model, Schema } from 'mongoose';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { IUser, UserModal } from './user.interface';
import { DAY, GENDER, STATUS } from '../../../shared/constant';
import { SHIFT_STATUS } from './user.constant';

const userSchema = new Schema<IUser, UserModal>(
  {
    name: {
      type: String,
      required: true,
    },
    institutionID: {
      type: Schema.Types.ObjectId,
      ref: 'Institution',
    },
    departmentID: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
    },
    designationID: {
      type: Schema.Types.ObjectId,
      ref: 'Designation',
    },
    weekend: {
      type: [String],
      enum: Object.values(DAY),
    },
    shiftSchedule: {
      type: Schema.Types.ObjectId,
      ref: 'Shift',
    },
    joiningDate: {
      type: String,
    },
    gender: {
      type: String,
      enum: Object.values(GENDER),
    },
    emergencyContact: {
      type: String,
    },
    employeeID: {
      type: String,
    },
    phone: {
      type: String,
    },
    countryCode: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: 0,
      minlength: 8,
    },
    role: {
      type: String,
      enum: Object.values(USER_ROLES),
    },
    address: {
      type: String,
    },
    profileImage: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: Object.values(STATUS),
      default: STATUS.ACTIVE,
    },
    shiftStatus: {
      type: String,
      enum: Object.values(SHIFT_STATUS),
      default: SHIFT_STATUS.UNASSIGNED,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },

    stripeCustomerId: {
      type: String,
      default: '',
    },
    isSubscribed: {
      type: Boolean,
    },
    hasAccess: {
      type: Boolean,
    },
    packageName: {
      type: String,
    },
    authentication: {
      type: {
        isResetPassword: {
          type: Boolean,
          default: false,
        },
        oneTimeCode: {
          type: Number,
          default: null,
        },
        expireAt: {
          type: Date,
          default: null,
        },
      },
      select: 0,
    },
  },
  { timestamps: true },
);

//exist user check
userSchema.statics.isExistUserById = async (id: string) => {
  const isExist = await User.findById(id);
  return isExist;
};

userSchema.statics.isExistUserByEmail = async (email: string) => {
  const isExist = await User.findOne({ email });
  return isExist;
};

//is match password
userSchema.statics.isMatchPassword = async (
  password: string,
  hashPassword: string,
): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

//check user
userSchema.pre('save', async function (next) {
  //check user
  const isExist = await User.findOne({ email: this.email });
  if (isExist) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Email already exist!');
  }

  //password hash
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds),
  );
  next();
});

export const User = model<IUser, UserModal>('User', userSchema);
