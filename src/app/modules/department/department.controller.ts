import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { DepartmentServices } from './department.service';
import { Request, Response } from 'express';

const createDepartment = catchAsync(async (req, res) => {

  const result = await DepartmentServices.createDepartmentToDB(
    req.body,
    req.user,
  );
  if (result.status === "NOT_FOUND") {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.NOT_FOUND,
      message: 'Institution not found',
      data: result,
    });
    return;
  }
  if (result.status === "FAILED") {
    sendResponse(res, {
      success: false,
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Failed to create department',
      data: result,
    });
    return;
  }
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Department created successfully',
    data: result,
  });
});

const getDepartments = catchAsync(async (req: Request, res: Response) => {
  const result = await DepartmentServices.getDepartmentsFromDB(req.user!, req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Departments are retrieved successfully',
    data: result,
  });
});

const getDepartmentById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { departmentID } = req.params;
  const result = await DepartmentServices.getDepartmentByIdFromDB(
    id,
    departmentID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Department data is retrieved successfully',
    data: result,
  });
});

const updateDepartmentById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { departmentID } = req.params;
  const updatedPayload = req.body;
  const result = await DepartmentServices.updateDepartmentByIdToDB(
    id,
    departmentID,
    updatedPayload,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Department data is updated successfully',
    data: result,
  });
});

const updateDepartmentStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { departmentID } = req.params;
  const { status } = req.body;
  const result = await DepartmentServices.updateDepartmentStatusByIdToDB(
    id,
    departmentID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Department status is updated successfully',
    data: result,
  });
});

const deleteDepartmentById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { departmentID } = req.params;
  const result = await DepartmentServices.deleteDepartmentByIdFromDB(
    id,
    departmentID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Department is deleted successfully',
    data: result,
  });
});

export const DepartmentControllers = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartmentById,
  updateDepartmentStatusById,
  deleteDepartmentById,
};
