import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { EmployeeServices } from './employee.service';

const getEmployees = catchAsync(async (req, res) => {
  const { id } = req.user;
  const result = await EmployeeServices.getEmployeesFromDB(id, req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employees data are retrieved successfully',
    data: result,
  });
});

const getEmployeeById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { employeeID } = req.params;
  const result = await EmployeeServices.getEmployeeByIdFromDB(id, employeeID);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee data is retrieved successfully',
    data: result,
  });
});

const updateEmployeeById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { ...updatedPayload } = req.body;
  const { employeeID } = req.params;

  let image = '';
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const profileFile = files?.profileImage?.[0];
  if (profileFile) {
    image = `/uploads/image/${profileFile.filename}`;
  }

  const updatedData = {
    ...updatedPayload,
    profileImage: image,
  };

  const result = await EmployeeServices.updateEmployeeByIdToDB(
    id,
    employeeID,
    updatedData,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee data is updated successfully',
    data: result,
  });
});

const updateEmployeeStatusById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { employeeID } = req.params;
  const { status } = req.body;
  const result = await EmployeeServices.updateEmployeeStatusByIdToDB(
    id,
    employeeID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee status is updated successfully',
    data: result,
  });
});

const deleteEmployeeById = catchAsync(async (req, res) => {
  const { id } = req.user;
  const { employeeID } = req.params;
  const result = await EmployeeServices.deleteEmployeeByIdFromDB(
    id,
    employeeID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Employee is deleted successfully',
    data: result,
  });
});

export const EmployeeControllers = {
  getEmployees,
  getEmployeeById,
  updateEmployeeById,
  updateEmployeeStatusById,
  deleteEmployeeById,
};
