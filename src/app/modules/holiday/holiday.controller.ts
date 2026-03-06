import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { HolidayServices } from './holiday.service';

const createHoliday = catchAsync(async (req, res) => {
  const holidayData = req.body;
  const user = req.user;
  const result = await HolidayServices.createHolidayToDB(holidayData, user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Holiday created successfully',
    data: result,
  });
});

const getHolidays = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await HolidayServices.getHolidaysFromDB(id, req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Holidays data are retrieved successfully',
    data: result,
  });
});

const getHolidayById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { holidayID } = req.params;
  const result = await HolidayServices.getHolidayByIdFromDB(id, holidayID);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Holiday data is retrieved successfully',
    data: result,
  });
});

const updateHolidayById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { holidayID } = req.params;
  const updatedPayload = req.body;
  const result = await HolidayServices.updateHolidayByIdToDB(
    id,
    holidayID,
    updatedPayload,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Holiday data is updated successfully',
    data: result,
  });
});

const updateHolidayStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { holidayID } = req.params;
  const { status } = req.body;
  const result = await HolidayServices.updateHolidayStatusByIdToDB(
    id,
    holidayID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Holiday status is updated successfully',
    data: result,
  });
});

const deleteHolidayById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { holidayID } = req.params;
  const result = await HolidayServices.deleteHolidayByIdFromDB(id, holidayID);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Holiday is deleted successfully',
    data: result,
  });
});

export const HolidayControllers = {
  createHoliday,
  getHolidays,
  getHolidayById,
  updateHolidayById,
  updateHolidayStatusById,
  deleteHolidayById,
};
