import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AnalyticsServices } from './analytics.service';

const getAbsents = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AnalyticsServices.getAbsentsFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Absents are retrieved successfully',
    data: result,
  });
});

const getLates = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AnalyticsServices.getLatesFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Late attendances are retrieved successfully',
    data: result,
  });
});

const getPresentSummaryLastSevenDays = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result =
    await AnalyticsServices.getPresentSummaryLastSevenDaysFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Presents chart data are retrieved successfully',
    data: result,
  });
});

const getTodayAttendanceSummary = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AnalyticsServices.getTodayAttendanceSummaryFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Today attendance summary data is retrieved successfully',
    data: result,
  });
});

const getLastSevenDaysSummaryForBusinessOwner = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result =
    await AnalyticsServices.getLastSevenDaysSummaryForBusinessOwnerFromDB(id);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Last seven days summary data is retrieved successfully',
    data: result,
  });
});

const getDashboardSummary = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await AnalyticsServices.getDashboardSummaryFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Dashboard summary is retrieved successfully',
    data: result,
  });
});

const getRevenueByMonth = catchAsync(async (req, res) => {
  const year =
    req.query.year && !isNaN(Number(req.query.year))
      ? Number(req.query.year)
      : new Date().getUTCFullYear();

  const result = await AnalyticsServices.getRevenueByMonthFromDB(year);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Total revenue is retrieved successfully',
    data: result,
  });
});

const getSummaryStats = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getSummaryStatsFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Dashboard summary stats is retrieved successfully',
    data: result,
  });
});

const getRecentInstitutions = catchAsync(async (req, res) => {
  const result = await AnalyticsServices.getRecentInstitutionsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Get recent institutions are retrieved successfully',
    data: result,
  });
});

export const AnalyticsControllers = {
  getAbsents,
  getLates,
  getPresentSummaryLastSevenDays,
  getTodayAttendanceSummary,
  getLastSevenDaysSummaryForBusinessOwner,
  getDashboardSummary,
  getRevenueByMonth,
  getSummaryStats,
  getRecentInstitutions,
};
