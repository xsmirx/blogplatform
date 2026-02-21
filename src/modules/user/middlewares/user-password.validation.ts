import { body } from 'express-validator';

export const passwordValidation = body('password')
  .isString()
  .withMessage('Password must be a string')
  .trim()
  .isLength({ min: 6, max: 20 })
  .withMessage('Password must be between 6 and 20 characters long');
