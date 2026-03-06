import { ShiftAndLeaveRequest } from './shiftAndLeaveRequest.model';
import { JwtPayload } from 'jsonwebtoken';
import { TShiftAndLeaveRequest } from './shiftAndLeaveRequest.interface';
import { User } from '../user/user.model';
import ApiError from '../../../errors/ApiError';
import { getAllUserIdsUnderRootOwner } from '../../../util/getAllUserIdsUnderRootOwner';
import { StatusCodes } from 'http-status-codes';
import { REQUEST_STATUS, REQUEST_TYPE } from './shiftAndLeaveRequest.constant';
import { toUTCISOString } from '../../../util/parseDateToUTC';
import dayjs from 'dayjs';
import QueryBuilder from '../../builder/QueryBuilder';
import { sendNotifications } from '../../../helpers/notificationHelper';
import { USER_ROLES } from '../../../enums/user';

const createShiftAndLeaveRequestToDB = async (
  payload: TShiftAndLeaveRequest,
  userId: JwtPayload,
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, 'No User is found in the database');
  }

  payload.userID = user._id;
  payload.currentShiftID = user.shiftSchedule;
  payload.createdBy = user._id;

  if (payload.requestType === REQUEST_TYPE.VACATION) {
    if (!payload.vacationStartDate || !payload.vacationEndDate) {
      throw new ApiError(400, 'Vacation start and end dates are required');
    }

    // Convert to ISO strings
    const startISO = toUTCISOString(payload.vacationStartDate);
    const endISO = toUTCISOString(payload.vacationEndDate);

    // Validate range
    const start = dayjs(startISO);
    const end = dayjs(endISO);
    if (end.isBefore(start)) {
      throw new ApiError(400, 'End date cannot be before start date.');
    }

    // Count total days (inclusive)
    const totalDays = end.diff(start, 'day') + 1;

    payload.vacationStartDate = startISO;
    payload.vacationEndDate = endISO;
    (payload as any).totalDays = Number(totalDays);

    // Check overlapping vacation requests
    const overlappingVacation = await ShiftAndLeaveRequest.findOne({
      userID: user._id,
      requestType: REQUEST_TYPE.VACATION,
      status: { $ne: 'REJECTED' },
      $or: [
        {
          vacationStartDate: { $lte: payload.vacationEndDate },
          vacationEndDate: { $gte: payload.vacationStartDate },
        },
      ],
    });

    if (overlappingVacation) {
      throw new ApiError(
        400,
        'You already have a vacation request overlapping this date range.',
      );
    }
  } else if (payload.requestType === REQUEST_TYPE.SHIFT_CHANGE) {
    if (!payload.requestedDate || !payload.requestedShiftID) {
      throw new ApiError(400, 'Requested shift ID and date are required');
    }

    payload.requestedDate = toUTCISOString(payload.requestedDate);

    const existingShiftChange = await ShiftAndLeaveRequest.findOne({
      userID: user._id,
      requestType: REQUEST_TYPE.SHIFT_CHANGE,
      requestedDate: payload.requestedDate,
      status: { $ne: 'REJECTED' },
    });

    if (existingShiftChange) {
      throw new ApiError(
        400,
        'You already have a shift change request on this date.',
      );
    }
  } else {
    throw new ApiError(400, 'Invalid request type');
  }

  const result = await ShiftAndLeaveRequest.create(payload);

  if (!result) {
    throw new ApiError(400, 'Failed to create shift and leave request');
  }

  // ================== SEND NOTIFICATION TO ALL HR UNDER ROOT OWNER ==================
  // trace root owner
  let rootOwnerId = user._id.toString();
  let currentUser: any = await User.findById(user._id).select('createdBy');

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all users under root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // find all HR users under root owner
  const hrUsers = await User.find({
    _id: { $in: allUserIds },
    role: {
      $in: [
        USER_ROLES.HR,
        USER_ROLES.DEPARTMENT_MANAGER,
        USER_ROLES.BUSINESS_OWNER,
      ],
    },
  }).select('_id name');

  for (const hr of hrUsers) {
    await sendNotifications({
      title:
        payload.requestType === REQUEST_TYPE.SHIFT_CHANGE
          ? 'New Shift Change Request'
          : 'New Leave Request',
      message:
        payload.requestType === REQUEST_TYPE.SHIFT_CHANGE
          ? `${user.name} has submitted a shift change request. Please review it.`
          : `${user.name} has submitted a leave request. Please review it.`,
      receiver: hr._id,
      type:
        payload.requestType === REQUEST_TYPE.SHIFT_CHANGE
          ? 'SHIFT_CHANGE'
          : 'LEAVE_REQUEST',
      data: {
        employeeID: user.employeeID,
        institution: user.institutionID,
        department: user.departmentID,
        shiftSchedule: user.shiftSchedule,
      },
    });
  }

  return result;
};

const getShiftAndLeaveRequestsFromDB = async (
  userId: string,
  query: Record<string, any>,
) => {
  // trace up to root owner
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // get all userIds under this root owner
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // base query
  const baseQuery = {
    createdBy: { $in: allUserIds },
  };

  // build with QueryBuilder
  const builder = new QueryBuilder(ShiftAndLeaveRequest.find(baseQuery), query)
    .filter()
    .sort()
    .paginate()
    .populate(['createdBy', 'userID', 'currentShiftID', 'requestedShiftID'], {
      createdBy: 'name email profileImage role',
      userID:
        'name institutionID departmentID designationID weekend employeeID phone email role profileImage shiftStatus',
      currentShiftID: 'shiftName shiftStartTime shiftEndTime',
      requestedShiftID: 'shiftName shiftStartTime shiftEndTime',
    });

  builder.modelQuery.populate({
    path: 'userID',
    populate: [
      { path: 'institutionID', select: 'institutionName logo' },
      { path: 'departmentID', select: 'departmentName totalEmployee' },
      { path: 'designationID', select: 'designationName' },
      {
        path: 'shiftSchedule',
        select: 'shiftName shiftStartTime shiftEndTime',
      },
    ],
  });

  const [data, meta] = await Promise.all([
    builder.modelQuery,
    builder.getPaginationInfo(),
  ]);

  return { data, meta };
};

const getShiftAndLeaveRequestByIdFromDB = async (
  userId: string,
  shiftAndLeaveRequestID: string,
) => {
  // Step 1: Trace root owner from userId
  let currentUser = await User.findById(userId).select('createdBy');
  let rootOwnerId = userId;

  while (currentUser?.createdBy) {
    rootOwnerId = currentUser.createdBy.toString();
    currentUser = await User.findById(currentUser.createdBy).select(
      'createdBy',
    );
  }

  // Step 2: Get all user IDs under this root owner (HRs, managers, etc.)
  const allUserIds = await getAllUserIdsUnderRootOwner(rootOwnerId);

  // Step 3: Find the shift and leave request if it's created by an allowed user
  const shiftAndLeaveRequest = await ShiftAndLeaveRequest.findOne({
    _id: shiftAndLeaveRequestID,
    createdBy: { $in: allUserIds },
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'userID',
      select:
        'name institutionID departmentID designationID weekend employeeID phone email role profileImage shiftStatus',
      populate: [
        {
          path: 'institutionID',
          select: 'institutionName logo',
        },
        {
          path: 'departmentID',
          select: 'departmentName totalEmployee',
        },
        {
          path: 'designationID',
          select: 'designationName',
        },
      ],
    })
    .populate('currentShiftID requestedShiftID')
    .sort({ createdAt: -1 });

  if (!shiftAndLeaveRequest) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Shift and leave request is not found or access denied',
    );
  }

  return shiftAndLeaveRequest;
};

const getOwnShiftRequestsFromDB = async (userId: string) => {
  const shiftRequests = await ShiftAndLeaveRequest.find({
    userID: userId,
    requestType: REQUEST_TYPE.SHIFT_CHANGE,
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'userID',
      select:
        'name institutionID departmentID designationID weekend employeeID phone email role profileImage shiftStatus',
      populate: [
        {
          path: 'institutionID',
          select: 'institutionName logo',
        },
        {
          path: 'departmentID',
          select: 'departmentName totalEmployee',
        },
        {
          path: 'designationID',
          select: 'designationName',
        },
      ],
    })
    .populate('currentShiftID requestedShiftID')
    .sort({ createdAt: -1 }); // ✅ নতুন আগে
  if (!shiftRequests || shiftRequests.length === 0) {
    throw new ApiError(404, 'No availale shift requests');
  }
  return shiftRequests;
};

const getOwnLeaveRequestsFromDB = async (userId: string) => {
  const leaveRequests = await ShiftAndLeaveRequest.find({
    userID: userId,
    requestType: REQUEST_TYPE.VACATION,
  })
    .populate({ path: 'createdBy', select: 'name email profileImage role' })
    .populate({
      path: 'userID',
      select:
        'name institutionID departmentID designationID weekend employeeID phone email role profileImage shiftStatus',
      populate: [
        {
          path: 'institutionID',
          select: 'institutionName logo',
        },
        {
          path: 'departmentID',
          select: 'departmentName totalEmployee',
        },
        {
          path: 'designationID',
          select: 'designationName',
        },
      ],
    })
    .populate('currentShiftID requestedShiftID')
    .sort({ createdAt: -1 });
  if (!leaveRequests || leaveRequests.length === 0) {
    throw new ApiError(404, 'No available leave requests');
  }
  return leaveRequests;
};

const updateShiftAndLeaveRequestStatusByIdToDB = async (
  userId: string,
  shiftAndLeaveRequestID: string,
  status:
    | REQUEST_STATUS.PENDING
    | REQUEST_STATUS.APPROVE
    | REQUEST_STATUS.REJECT,
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

  // check if shift and leave request is owned by a valid user
  const shiftAndLeaveRequest = await ShiftAndLeaveRequest.findOne({
    _id: shiftAndLeaveRequestID,
    createdBy: { $in: allUserIds },
  });

  if (!shiftAndLeaveRequest) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'Shift and leave request not found or access denied',
    );
  }

  // perform the update
  const updatedShiftAndLeaveRequestStatus =
    await ShiftAndLeaveRequest.findByIdAndUpdate(
      shiftAndLeaveRequestID,
      { status },
      { new: true },
    ).populate({ path: 'createdBy', select: 'name email profileImage role' });

  const employeeId =
    updatedShiftAndLeaveRequestStatus?.createdBy?._id?.toString();

  if (!employeeId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Employee ID not found for notification',
    );
  }

  const requestType = updatedShiftAndLeaveRequestStatus?.requestType;

  if (requestType === 'SHIFT_CHANGE') {
    await sendRequestStatusNotification('SHIFT_CHANGE', employeeId, status);
  } else if (requestType === 'VACATION') {
    await sendRequestStatusNotification('VACATION', employeeId, status);
  }

  return updatedShiftAndLeaveRequestStatus;
};

const updateMultipleShiftAndLeaveRequestStatusesToDB = async (
  userId: string,
  payload: any,
) => {
  const { requestIDs, status } = payload;

  // validate user and trace root owner
  const requestingUser = await User.findById(userId).select('createdBy role');
  if (!requestingUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

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

  // validate that all requests belong to authorized users
  const validRequests = await ShiftAndLeaveRequest.find({
    _id: { $in: requestIDs },
    createdBy: { $in: allUserIds },
  }).select('_id');

  const validIds = validRequests.map(req => req._id);

  if (validIds.length === 0) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      'No valid shift and leave requests found for update',
    );
  }

  // update all matched requests
  await ShiftAndLeaveRequest.updateMany(
    { _id: { $in: validIds } },
    { $set: { status } },
  );

  // return the updated documents
  const updatedRequests = await ShiftAndLeaveRequest.find({
    _id: { $in: validIds },
  }).populate({ path: 'createdBy', select: 'name email role' });

  return updatedRequests;
};

const sendRequestStatusNotification = async (
  requestType: 'SHIFT_CHANGE' | 'VACATION',
  employeeId: string,
  status: string,
) => {
  if (requestType === 'SHIFT_CHANGE') {
    await sendNotifications({
      title: 'Shift Change Request Status',
      receiver: employeeId,
      message: `Your shift change request has been ${status}. Please review your updated schedule.`,
      type: 'EMPLOYEE_REQUEST_STATUS',
    });
  } else if (requestType === 'VACATION') {
    await sendNotifications({
      title: 'Leave Request Status',
      receiver: employeeId,
      message: `Your leave request has been ${status}. Please plan your work accordingly.`,
      type: 'EMPLOYEE_REQUEST_STATUS',
    });
  } else {
    throw new Error('Unsupported request type for notification');
  }
};

export const ShiftAndLeaveRequestServices = {
  createShiftAndLeaveRequestToDB,
  getShiftAndLeaveRequestsFromDB,
  getShiftAndLeaveRequestByIdFromDB,
  updateShiftAndLeaveRequestStatusByIdToDB,
  updateMultipleShiftAndLeaveRequestStatusesToDB,
  getOwnShiftRequestsFromDB,
  getOwnLeaveRequestsFromDB,
};
