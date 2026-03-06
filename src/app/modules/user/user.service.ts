import { Subscription } from './../subscription/subscription.model';
import { SUBSCRIPTION_STATUS } from './../subscription/subscription.constant';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from 'jsonwebtoken';
import { USER_ROLES } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { emailHelper } from '../../../helpers/emailHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import unlinkFile from '../../../shared/unlinkFile';
import generateOTP from '../../../util/generateOTP';
import { IUser } from './user.interface';
import { User } from './user.model';
import { Institution } from '../institution/institution.model';
import { Shift } from '../shift/shift.model';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { STATUS } from '../../../shared/constant';
import { SHIFT_STATUS } from './user.constant';
import { Department } from '../department/department.model';
import QueryBuilder from '../../builder/QueryBuilder';
import stripe from '../../../config/stripe';
import { ProgramForBulkUserCreation } from '../../../helpers/ProgramForBulkUserCreation';
import config from '../../../config';

const createUserToDB = async (payload: Partial<IUser>): Promise<IUser> => {
  payload.role = USER_ROLES.BUSINESS_OWNER;
  const createUser = await User.create(payload);
  if (!createUser) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Failed to create business owner account',
    );
  }

  //send email
  const otp = generateOTP();
  const values = {
    name: createUser.name,
    otp: otp,
    email: createUser.email!,
  };
  const createAccountTemplate = emailTemplate.createAccount(values);
  emailHelper.sendEmail(createAccountTemplate);

  //save to DB
  const authentication = {
    oneTimeCode: otp,
    expireAt: new Date(Date.now() + 3 * 60000),
  };
  await User.findOneAndUpdate(
    { _id: createUser._id },
    { $set: { authentication } },
  );

  return createUser;
};

const createSubUserByOwnerToDB = async (
  payload: Partial<IUser>,
  userId: any,
) => {
  if (!payload.role) {
    throw new ApiError(400, 'Role is required');
  }

  if (!payload.password) {
    throw new ApiError(400, 'Password is required');
  }

  if (!userId) {
    throw new ApiError(400, 'Created by ID is missing');
  }

  payload.createdBy = userId;

  const result = await User.create({ ...payload, verified: true });

  if (!result) {
    throw new ApiError(400, 'Failed to create sub user');
  }

  return result;
};

const createEmployeeToDB = async (
  payload: Partial<IUser>,
  user: JwtPayload,
) => {
  payload.createdBy = user.id;
  payload.role = USER_ROLES.EMPLOYEE;
  payload.password = '12345678';

  const [institutions, departments, shifts] = await Promise.all([
    Institution.findById(payload.institutionID).lean().exec(),
    Department.findById(payload.departmentID).lean().exec(),
    Shift.findById(payload.shiftSchedule).lean().exec(),
  ]);

  if (!institutions) return { status: "INSTITUTION_NOT_FOUND" } as const;
  if (!departments) return { status: "DEPARTMENT_NOT_FOUND" } as const;
  if (payload.shiftSchedule && !shifts) return { status: "SHIFT_NOT_FOUND" } as const;

  // duplicate query remove
  const shift = shifts || null;

  const existingEmployee = await User.findOne({
    institutionID: payload.institutionID,
    employeeID: payload.employeeID,
  });

  if (existingEmployee) {
    throw new ApiError(StatusCodes.CONFLICT, 'This employee ID already exists in this institution');
  }

  const userData = {
    ...payload,
    verified: true,
    shiftStatus: shift ? SHIFT_STATUS.ASSIGNED : SHIFT_STATUS.UNASSIGNED,
  };

  const packageDetails = await Subscription.findOne({
    userId: user.id,
    status: SUBSCRIPTION_STATUS.ACTIVE,
  }).populate('packageId', 'planName packageType price');

  if (!packageDetails) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No active subscription found');
  }

  const packageType = (packageDetails as any)?.packageId?.packageType;

  if (packageType === "individual") {
    const currentEmployeeCount = packageDetails?.totalEmployees ?? 0;

    if (currentEmployeeCount >= 1) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: (packageDetails as any)?.packageId.planName,
              },
              unit_amount: (packageDetails as any)?.packageId.price * 100,
            },
            quantity: 1,
          },
        ],
        success_url: config.stripe.EMPLOYEE_CREATION_AFTER_PAYMENT_LINK!,
        cancel_url: config.stripe.EMPLOYEE_CREATION_AFTER_PAYMENT_LINK_Failed!,
        metadata: {
          userData: JSON.stringify(userData),
          userId: user.id,
          subscriptionId: String((packageDetails as any)?._id),
          packagePrice: String((packageDetails as any)?.packageId.price),
        },
      });
      return {
        status: "PAYMENT_REQUIRED",
        paymentUrl: session.url,
      } as const;

    } else {
      await Subscription.findOneAndUpdate(
        { userId: user.id, status: SUBSCRIPTION_STATUS.ACTIVE },
        { $inc: { totalEmployees: 1 } },
      );

      const result = await User.create(userData);
      // need to send email to employee after creation
      const createAccountTemplate = emailTemplate.employeeEmailTemplate({
        name: result.name,
        email: result.email!,
        password: '12345678',
      });
      try {
        await emailHelper.sendEmail(createAccountTemplate);
        console.log('✅ Email sent to:', result.email);
      } catch (err) {
        console.error('❌ Email sending failed:', err);
      }

      if (!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create employee');
      return result;
    }
  } else if (packageType === "program") {
    const result = await ProgramForBulkUserCreation(payload, user);
    return result;
  }

  // ========================
  // default
  // ========================
  const result = await User.create(userData);
  if (!result) throw new ApiError(StatusCodes.BAD_REQUEST, 'Failed to create employee');
  return result;
};

const getUserProfileFromDB = async (
  user: JwtPayload,
): Promise<Partial<IUser>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  return isExistUser;
};

const getBusinessOwnersFromDB = async (query: any) => {
  const DAY_IN_MS = 24 * 60 * 60 * 1000;

  // queryBuilder apply (WITHOUT paginate)
  const queryBuilder = new QueryBuilder(
    User.find({ role: USER_ROLES.BUSINESS_OWNER }),
    query,
  );

  const searchableFields = ['email', 'name'];

  const ownersQuery = queryBuilder
    .search(searchableFields)
    .filter()
    .sort()
    .fields();
  const businessOwners = await ownersQuery.modelQuery;

  // summary calculation
  const summaries = await Promise.all(
    businessOwners.map(async (owner: any) => {
      const institutions = await Institution.find({ owner: owner._id }).select(
        '_id name status role',
      );

      if (!institutions?.length) return null;

      const allUserIds = await getAllUserIdsUnderRootOwner(
        owner._id.toString(),
      );

      const subscription = await Subscription.findOne({
        userId: owner._id,
        status: SUBSCRIPTION_STATUS.ACTIVE,
      })
        .sort({ createdAt: -1 })
        .select('currentPeriodStart currentPeriodEnd status');

      let planRunning = 0;

      if (subscription?.currentPeriodStart && subscription?.currentPeriodEnd) {
        const start = new Date(subscription.currentPeriodStart);
        const end = new Date(subscription.currentPeriodEnd);
        planRunning = Math.ceil((end.getTime() - start.getTime()) / DAY_IN_MS);
      }

      const totalUsers = await User.countDocuments({
        _id: { $in: allUserIds },
      });

      return {
        _id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner?.phone,
        role: owner.role,
        status: owner.status,
        subscribed: owner?.isSubscribed,
        totalInstitutions: institutions.length,
        totalUsers,
        planRunning,
      };
    }),
  );

  // filter out nulls (owners without institutions)
  const filteredSummaries = summaries.filter(Boolean);

  // manual pagination (since institution-less owners skipped)
  const page = Number(query.page || 1);
  const limit = Number(query.limit || 10);
  const total = filteredSummaries.length;
  const totalPage = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedData = filteredSummaries.slice(startIndex, startIndex + limit);

  return {
    meta: {
      total,
      limit,
      page,
      totalPage,
    },
    data: paginatedData,
  };
};

const getInstitutionsByOwnerIdFromDB = async (ownerId: string, query: any) => {
  if (!ownerId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Owner ID is required');
  }

  const owner = await User.isExistUserById(ownerId);
  if (!owner) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No business owner found in the database',
    );
  }

  const queryBuilder = new QueryBuilder(
    Institution.find({ owner: ownerId }),
    query,
  );

  const finalQuery = queryBuilder.filter().sort().paginate().fields();
  const institutions = await finalQuery.modelQuery;
  const meta = await queryBuilder.getPaginationInfo();

  const institutionsWithEmployeeCount = await Promise.all(
    institutions.map(async (institution: any) => {
      const totalUsers = await User.countDocuments({
        institutionID: institution._id,
      });

      const subscription = await Subscription.findOne({ userId: owner._id });

      return {
        _id: institution._id,
        institutionName: institution.institutionName,
        address: institution.address,
        email: institution.email,
        phoneNumber: institution.phoneNumber,
        owner,
        subscription,
        totalUsers,
        status: institution.status,
        createdAt: institution.createdAt,
        updatedAt: institution.updatedAt,
      };
    }),
  );

  return {
    meta,
    data: institutionsWithEmployeeCount,
  };
};

// const updateProfileToDB = async (
//   user: JwtPayload,
//   payload: Partial<IUser>,
// ): Promise<Partial<IUser | null>> => {
//   const { id } = user;
//   const isExistUser = await User.isExistUserById(id);
//   if (!isExistUser) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
//   }

//   const result = await User.findOneAndUpdate({ _id: id }, payload, {
//     new: true,
//   });

//   //unlink file here
//   if (payload.profileImage) {
//     if (!result) {
//       throw new ApiError(400, 'Failed to update profile');
//     }
//     unlinkFile(isExistUser.profileImage);
//   }

//   return result;
// };

const updateProfileToDB = async (
  user: JwtPayload,
  payload: Partial<IUser>,
): Promise<Partial<IUser | null>> => {
  const { id } = user;
  const isExistUser = await User.isExistUserById(id);
  if (!isExistUser) {
    throw new ApiError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
  }

  const result = await User.findOneAndUpdate({ _id: id }, payload, {
    new: true,
  });

  // if upload new profile image, than update profile image
  if (payload.profileImage) {
    if (!result) {
      throw new ApiError(400, 'Profile update issue');
    }

    // if profile image is exist than unlink existing image
    if (isExistUser.profileImage) {
      unlinkFile(isExistUser.profileImage);
    }
  }

  return result;
};

const getSubUsersFromDB = async (userId: string, query: any) => {
  // trace root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all user IDs under root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // base query
  const baseQuery = {
    createdBy: { $in: allUserIds },
    role: { $in: [USER_ROLES.HR, USER_ROLES.DEPARTMENT_MANAGER] },
  };

  // build with QueryBuilder
  const builder = new QueryBuilder(User.find(baseQuery), query)
    .search(['name', 'email', 'employeeID'])
    .filter()
    .sort()
    .paginate()
    .populate(['createdBy'], {
      createdBy: 'name email profileImage role',
    });

  const [data, meta] = await Promise.all([
    builder.modelQuery,
    builder.getPaginationInfo(),
  ]);

  return { data, meta };
};

const getSubUserByIdFromDB = async (userId: string, subUserId: string) => {
  // trace root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all user IDs under root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  if (!allUserIds.includes(subUserId)) {
    throw new Error('Unauthorized or user not found');
  }

  const subUser = await User.findById(subUserId)
    .select('name email employeeID role profileImage createdBy')
    .populate('createdBy', 'name email profileImage role');

  return subUser;
};

const getAllBusinessOwnersFromDB = async () => {
  const result = await User.find({
    role: USER_ROLES.BUSINESS_OWNER,
    status: 'ACTIVE',
  }).select('name _id role');
  if (!result || result.length === 0) {
    throw new ApiError(404, 'No business owner is found');
  }
  return result;
};

const updateSubUserByIdToDB = async (
  userId: string,
  subUserID: string,
  updatedPayload: Partial<IUser>,
) => {
  // get the requesting user's role
  const requestingUser = await User.findById(userId).select('createdBy role');

  if (!requestingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // trace root owner
  let rootOwnerId = userId;
  let currentUser: any = await User.findById(userId).select('createdBy');

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all valid user IDs under the root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // check if sub user is owned by a valid user
  const subUser = await User.findOne({
    _id: subUserID,
    createdBy: { $in: allUserIds },
  });

  if (!subUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'User not found or access denied',
    );
  }

  // perform the update
  const updatedSubUser = await User.findByIdAndUpdate(
    subUserID,
    updatedPayload,
    { new: true },
  ).populate({ path: 'createdBy', select: 'name email profileImage role' });

  return updatedSubUser;
};

const updateSubUserStatusByIdToDB = async (
  userId: string,
  subUserID: string,
  status: STATUS.ACTIVE | STATUS.INACTIVE,
) => {
  // get the requesting user's role
  const requestingUser = await User.findById(userId).select('createdBy role');

  if (!requestingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // trace root owner
  let rootOwnerId = userId;
  let currentUser: any = await User.findById(userId).select('createdBy');

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all valid user IDs under the root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // check if sub user is owned by a valid user
  const subUser = await User.findOne({
    _id: subUserID,
    createdBy: { $in: allUserIds },
  });

  if (!subUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Sub user not found or access denied',
    );
  }

  // perform the update
  const updatedSubUserStatus = await User.findByIdAndUpdate(
    subUserID,
    { status },
    { new: true },
  ).populate({ path: 'createdBy', select: 'name email profileImage role' });

  return updatedSubUserStatus;
};

const updateStatusToDB = async (
  id: string,
  status: STATUS.ACTIVE | STATUS.INACTIVE,
) => {
  const businessOwner = await User.findById(id);
  if (!businessOwner) {
    throw new ApiError(404, 'No business owner found database');
  }
  const result = await User.findByIdAndUpdate(id, { status }, { new: true });
  return result;
};

const deleteSubUserByIdFromDB = async (userId: string, subUserID: string) => {
  // get the requesting user's role
  const requestingUser = await User.findById(userId).select('createdBy role');

  if (!requestingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  // trace root owner
  let rootOwnerId = userId;
  let currentUser: any = await User.findById(userId).select('createdBy');

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all valid user IDs under the root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // check if sub user is owned by a valid user
  const subUser = await User.findOne({
    _id: subUserID,
    createdBy: { $in: allUserIds },
  });

  if (!subUser) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Sub user not found or access denied',
    );
  }

  // perform the update
  const deleteSubUser = await User.findByIdAndDelete(subUserID).populate({
    path: 'createdBy',
    select: 'name email profileImage role',
  });

  return deleteSubUser;
};

export const UserService = {
  createUserToDB,
  createSubUserByOwnerToDB,
  createEmployeeToDB,
  getUserProfileFromDB,
  updateProfileToDB,
  getSubUsersFromDB,
  updateSubUserByIdToDB,
  updateSubUserStatusByIdToDB,
  deleteSubUserByIdFromDB,
  getBusinessOwnersFromDB,
  updateStatusToDB,
  getInstitutionsByOwnerIdFromDB,
  getSubUserByIdFromDB,
  getAllBusinessOwnersFromDB,
};
