import express from 'express';
import { ContactControllers } from './contact.controller';
import validateRequest from '../../middlewares/validateRequest';
import { ContactValidation } from './contact.validation';

const router = express.Router();

router
  .route('/')
  .post(
    validateRequest(ContactValidation.createContactValidationSchema),
    ContactControllers.createContact,
  );

export const ContactRoutes = router;
