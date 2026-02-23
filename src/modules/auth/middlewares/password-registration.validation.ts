import { body } from 'express-validator';

export const passwordValidationForRegistration = body('password')
  .exists()
  .withMessage('Password is required')
  .isString()
  .withMessage('Password is required')
  .notEmpty()
  .withMessage('Password cannot be empty')
  .isLength({ min: 6, max: 20 })
  .withMessage('Password must be between 6 and 20 characters');
