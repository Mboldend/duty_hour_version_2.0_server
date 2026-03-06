import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { EarningServices } from './earning.service';

const getTotalEarnings = catchAsync(async (req, res) => {
  const result = await EarningServices.getTotalEarningsFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Get total earnings are retrieved successfully',
    data: result,
  });
});

export const EarningControllers = {
  getTotalEarnings,
};
