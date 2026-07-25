import { param } from 'express-validator';

export const deviceIdValidationParam = param('deviceId')
  .exists()
  .withMessage('ID is required')
  .isString()
  .trim()
  .withMessage('ID must be a string')
  .isLength({ min: 1 })
  .withMessage('ID must not be empty');
