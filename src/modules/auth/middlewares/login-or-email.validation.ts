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
