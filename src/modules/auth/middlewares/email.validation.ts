import { body } from 'express-validator';

export const emailValidation = body('email')
  .exists()
  .withMessage('Email is required')
  .isString()
  .trim()
  .withMessage('Email is required')
  .notEmpty()
  .withMessage('Email cannot be empty');
