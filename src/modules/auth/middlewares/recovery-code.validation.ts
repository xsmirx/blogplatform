import { body } from 'express-validator';

export const recoveryCodeValidation = body('recoveryCode')
  .exists()
  .withMessage('Code is required')
  .isString()
  .trim()
  .withMessage('Code is required')
  .notEmpty()
  .withMessage('Code cannot be empty');
