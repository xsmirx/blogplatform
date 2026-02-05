import { Router } from 'express';
import { loginUserHandler } from './auth-handlers';
import { loginOrEmailValidation, passwordValidation } from './auth-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';

export const authRouter: Router = Router();

authRouter.post(
  '/login',
  loginOrEmailValidation,
  passwordValidation,
  inputValidationResultMiddleware,
  loginUserHandler,
);
