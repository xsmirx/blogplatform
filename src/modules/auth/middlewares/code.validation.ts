import { body } from 'express-validator';

export const codeValidation = body('code')
  .exists()
  .withMessage('Code is required')
  .isString()
  .trim()
  .withMessage('Code is required')
  .notEmpty()
  .withMessage('Code cannot be empty');
