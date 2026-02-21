import { body } from 'express-validator';

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
