import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import { LocationServices } from './location.service';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const createLocation = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const locationData = req.body;
  const result = await LocationServices.createLocation(locationData, user);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Location created successfully',
    data: result,
  });
});

const getAllLocation = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.user;
  const result = await LocationServices.getLocationsFromDB(id, req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Location retrieved successfully',
    data: result,
  });
});

const getLocationById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { locationID } = req.params;
  const result = await LocationServices.getLocationByIdFromDB(id, locationID);
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Location data is retrieved successfully',
    data: result,
  });
});

const updateLocationById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { locationID } = req.params;
  const updatedPayload = req.body;
  const result = await LocationServices.updateLocationByIdToDB(
    id,
    locationID,
    updatedPayload,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Location data is updated successfully',
    data: result,
  });
});

const updateLocationStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { locationID } = req.params;
  const { status } = req.body;
  const result = await LocationServices.updateLocationStatusByIdToDB(
    id,
    locationID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Location status is updated successfully',
    data: result,
  });
});

const deleteLocationById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { locationID } = req.params;
  const result = await LocationServices.deleteLocationByIdFromDB(
    id,
    locationID,
  );
  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Location is deleted successfully',
    data: result,
  });
});

export const LocationControllers = {
  createLocation,
  getAllLocation,
  getLocationById,
  updateLocationById,
  updateLocationStatusById,
  deleteLocationById,
};
