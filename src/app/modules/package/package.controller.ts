import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { PackageServices } from './package.service';

const createPackage = catchAsync(async (req, res) => {

  const result = await PackageServices.CreatePackageToDB(req.user!, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Subscription package is created successfully',
    data: result,
  });
});

const getPackages = catchAsync(async (req, res) => {
  const result = await PackageServices.getPackagesFromDB(req.query, req.user!);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Subscription packages are retrieved successfully',
    pagination: result.meta,
    data: result.data,
  });
});

const getActivePackage = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await PackageServices.getActivePackageFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Active subscription plan is retrieved successfully',
    data: result,
  });
});

const getPackageById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.getPackageByIdFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Subscription package is retrieved successfully',
    data: result,
  });
});


const deletePackageById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await PackageServices.deletePackageByIdFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Subscription package is deleted successfully',
    data: result,
  });
});

export const PackageControllers = {
  createPackage,
  getPackages,
  getPackageById,
  deletePackageById,
  getActivePackage,
};
