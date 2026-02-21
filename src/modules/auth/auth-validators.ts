import { body } from 'express-validator';

export const loginOrEmailValidation = body('loginOrEmail')
  .exists()
  .withMessage('Login or Email is required')
  .isString()
  .withMessage('Login or Email is required')
  .notEmpty()
  .withMessage('Login or Email cannot be empty')
  .custom((value) => {
    if (/^\s+$/.test(value)) {
      throw new Error('Login or Email cannot contain only spaces');
    }
    return true;
  });

export const passwordValidation = body('password')
  .exists()
  .withMessage('Password is required')
  .isString()
  .withMessage('Password is required')
  .notEmpty()
  .withMessage('Password cannot be empty')
  .custom((value) => {
    if (/^\s+$/.test(value)) {
      throw new Error('Password cannot contain only spaces');
    }
    return true;
  });

export const loginValidation = body('login')
  .exists()
  .withMessage('Login is required')
  .isString()
  .withMessage('Login is required')
  .notEmpty()
  .withMessage('Login cannot be empty')
  .isLength({ min: 3, max: 10 })
  .withMessage('Login must be between 3 and 10 characters');

export const emailValidation = body('email')
  .exists()
  .withMessage('Email is required')
  .isString()
  .withMessage('Email is required')
  .trim()
  .notEmpty()
  .withMessage('Email cannot be empty')
  .isEmail()
  .withMessage('Invalid email format');

export const passwordValidationForRegistration = body('password')
  .exists()
  .withMessage('Password is required')
  .isString()
  .trim()
  .withMessage('Password is required')
  .notEmpty()
  .withMessage('Password cannot be empty')
  .isLength({ min: 6, max: 20 })
  .withMessage('Password must be between 6 and 20 characters');

export const codeValidation = body('code')
  .exists()
  .withMessage('Code is required')
  .isString()
  .trim()
  .withMessage('Code is required')
  .notEmpty()
  .withMessage('Code cannot be empty');
