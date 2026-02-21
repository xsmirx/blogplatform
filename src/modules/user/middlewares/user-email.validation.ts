import { body } from 'express-validator';

export const emailValidation = body('email')
  .isString()
  .withMessage('Email must be a string')
  .isEmail()
  .withMessage('Email must be a valid email address')
  .toLowerCase();
