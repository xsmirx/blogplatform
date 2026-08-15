import { body } from 'express-validator';

export const newPasswordValidation = body('newPassword')
  .isString()
  .withMessage('Password must be a string')
  .notEmpty()
  .withMessage('Password is required');
