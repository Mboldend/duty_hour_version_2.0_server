import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { InstitutionServices } from './institution.service';

const createInstitution = catchAsync(async (req, res) => {
  const { ...institutionData } = req.body;
  const user = req.user;

  let image = '';
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const logo = files?.logo?.[0];
  if (logo) {
    image = `/uploads/logo/${logo.filename}`;
  }

  const data = {
    ...institutionData,
    logo: image,
  };

  const result = await InstitutionServices.createInstitutionToDB(data, user);

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institution created successfully',
    data: result,
  });
});

const getInstitution = catchAsync(async (req, res) => {
  const { id, role } = req.user;
  const result = await InstitutionServices.getInstitutionsFromDB(
    id,
    role,
    req.query,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institution data are retrieved successfully',
    data: result,
  });
});

const getInstitutionById = catchAsync(async (req, res) => {
  const { id, role } = req.user;
  const { institutionID } = req.params;
  const result = await InstitutionServices.getInstitutionByIdFromDB(
    id,
    role,
    institutionID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institutioin data is retrieved successfully',
    data: result,
  });
});

const getInstitutionByIdForSuperAdmin = catchAsync(async (req, res) => {
  const { institutionID } = req.params;
  const result =
    await InstitutionServices.getInstitutionByIdForSuperAdminFromDB(
      institutionID,
    );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institution is retrieved successfully',
    data: result,
  });
});

const updateInstitutionStatusByIdForSuperAdmin = catchAsync(
  async (req, res) => {
    const { institutionID } = req.params;
    const { status } = req.body;
    const result =
      await InstitutionServices.updateInstitutionStatusByIdForSuperAdminToDB(
        institutionID,
        status,
      );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: 'Instution status is updated successfully',
      data: result,
    });
  },
);

const updateInstitutionById = catchAsync(async (req, res) => {
  const user = req.user;
  const { ...updatedPayload } = req.body;
  const { institutionID } = req.params;

  let image = '';
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const logo = files?.logo?.[0];
  if (logo) {
    image = `/uploads/logo/${logo.filename}`;
  }

  const updatedData = {
    ...updatedPayload,
    logo: image,
  };

  const result = await InstitutionServices.updateInstitutionByIdToDB(
    user,
    institutionID,
    updatedData,
  );

  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institution is updated successfully',
    data: result,
  });
});

const updateInstitutionStatusById = catchAsync(async (req, res) => {
  const user = req.user;
  const { institutionID } = req.params;
  const { status } = req.body;
  const result = await InstitutionServices.updateInstitutionStatusByIdToDB(
    user,
    institutionID,
    status,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institution status update successfully',
    data: result,
  });
});

const deleteInstitutionById = catchAsync(async (req, res) => {
  const user = req.user;
  const { institutionID } = req.params;
  const result = await InstitutionServices.deleteInstitutionByIdFromDB(
    user,
    institutionID,
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: 'Institution is deleted succesfully',
    data: result,
  });
});

export const InstitutionControllers = {
  createInstitution,
  getInstitution,
  getInstitutionById,
  updateInstitutionById,
  updateInstitutionStatusById,
  deleteInstitutionById,
  getInstitutionByIdForSuperAdmin,
  updateInstitutionStatusByIdForSuperAdmin,
};
