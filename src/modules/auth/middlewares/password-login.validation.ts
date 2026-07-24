import { body } from 'express-validator';

export const passwordLoginValidation = body('password')
  .isString()
  .withMessage('Password must be a string')
  .notEmpty()
  .withMessage('Password is required');
