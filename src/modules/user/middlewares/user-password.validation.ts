import { body } from 'express-validator';

export const passwordRegistrationValidation = body('password')
  .isString()
  .withMessage('Password must be a string')
  .isLength({ min: 6, max: 20 })
  .withMessage('Password must be between 6 and 20 characters long');
