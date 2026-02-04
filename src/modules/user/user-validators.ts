import { body, param } from 'express-validator';

export const idValidation = param('id')
  .exists()
  .withMessage('ID is required')
  .isString()
  .trim()
  .withMessage('ID must be a string')
  .isLength({ min: 1 })
  .withMessage('ID must not be empty')
  .isMongoId();

export const loginValidation = body('login')
  .isString()
  .withMessage('Login must be a string')
  .trim()
  .isLength({ min: 3, max: 10 })
  .withMessage('Login must be between 3 and 10 characters long')
  .matches(/^[a-zA-Z0-9_-]*$/)
  .withMessage(
    'Login must contain only letters, numbers, underscores, or hyphens',
  );

export const passwordValidation = body('password')
  .isString()
  .withMessage('Password must be a string')
  .trim()
  .isLength({ min: 6, max: 20 })
  .withMessage('Password must be between 6 and 20 characters long');

export const emailValidation = body('email')
  .isString()
  .withMessage('Email must be a string')
  .isEmail()
  .withMessage('Email must be a valid email address');
