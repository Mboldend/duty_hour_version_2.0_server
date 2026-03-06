import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AttendanceServices } from './attendance.service';

const requestManualPresent = catchAsync(async (req, res) => {
  const { id } = req.user;
  const payload = req.body;
  const result = await AttendanceServices.requestManualPresentFromDB(
    id,
    payload,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Manual present request send successfully',
    data: result,
  });
});

const getAllAttendances = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AttendanceServices.getAllAttendancesFromDB(
    id,
    req.query,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Attendances are retrieved successfully',
    data: result,
  });
});

const getAttendanceById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { attendanceID } = req.params;
  const result = await AttendanceServices.getAttendanceByIdFromDB(
    id,
    attendanceID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Attendance data is retrieved successfully',
    data: result,
  });
});

const getAttendanceSummaryByIdFromDB = catchAsync(async (req, res) => {
  const loggedInUserId = req.user.id;
  const targetUserId = req.params.userID;

  const month = req.query.month
    ? parseInt(req.query.month as string)
    : undefined;
  const year = req.query.year ? parseInt(req.query.year as string) : undefined;

  const result = await AttendanceServices.getAttendanceSummaryByIdFromDB(
    loggedInUserId,
    targetUserId,
    month,
    year,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Monthly attendance summary retrieved successfully',
    data: result,
  });
});

const getWeeklyAttendanceAnalytics = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AttendanceServices.getWeeklyAttendanceAnalytics(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Weekly attendance analytics is retrieved successfully',
    data: result,
  });
});

const checkin = catchAsync(async (req, res) => {
  const { id } = req.user;
  const attendanceData = req.body;
  const result = await AttendanceServices.checkIn(id, attendanceData);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Attendance request send successfully',
    data: result,
  });
});

const getUserAttendances = catchAsync(async (req, res) => {
  const { id } = req.user;
  const targetUserId = req.params.targetUserID;
  const result = await AttendanceServices.getUserAttendancesFromDB(
    id,
    targetUserId,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Attendances are retrieved successfully',
    data: result,
  });
});

const getEmployeeOwnAttendances = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AttendanceServices.getEmployeeOwnAttendancesFromDB(
    id,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee attendaces are retrieved successfully',
    data: result,
  });
});

const getEmployeeWeeklyAttendances = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result =
    await AttendanceServices.getEmployeeWeeklyAttendancesFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Weekly employee attendances are retrieved successfully',
    data: result,
  });
});

const getSelfFilteredAttendance = catchAsync(async (req, res) => {
  const { id } = req.user;

  const result = await AttendanceServices.getSelfFilteredAttendanceFromDB(
    id,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Attendances data are retrieved successfully',
    data: result,
  });
});

const getEmployeeTodayAttendance = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AttendanceServices.getEmployeeTodayAttendanceFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Today attendance data is retrieved successfully',
    data: result,
  });
});

const getEmployeeWeeklyReport = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AttendanceServices.getEmployeeWeeklyReportFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee weekly reports are retrieved successfully',
    data: result,
  });
});

const getEmployeeMonthlyReport = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AttendanceServices.getEmployeeMonthlyReportFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee monthly reports are retrieved successfully',
    data: result,
  });
});

export const AttendanceControllers = {
  getAllAttendances,
  getAttendanceById,
  getAttendanceSummaryByIdFromDB,
  getWeeklyAttendanceAnalytics,
  checkin,
  getUserAttendances,
  getEmployeeOwnAttendances,
  getEmployeeWeeklyAttendances,
  getSelfFilteredAttendance,
  getEmployeeTodayAttendance,
  getEmployeeWeeklyReport,
  getEmployeeMonthlyReport,
  requestManualPresent,
};
