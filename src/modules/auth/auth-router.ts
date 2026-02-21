import { Router } from 'express';
import { loginUserHandler, meHandler } from './auth-handlers';
import {
  codeValidation,
  emailValidation,
  loginOrEmailValidation,
  loginValidation,
  passwordValidation,
} from './auth-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';
import { accessTokenGuard } from './access-token-guard';

export const authRouter: Router = Router();

authRouter
  .post(
    '/login',
    loginOrEmailValidation,
    passwordValidation,
    inputValidationResultMiddleware,
    loginUserHandler,
  )
  .get('/me', accessTokenGuard, meHandler)
  .post(
    '/registration-confirmation',
    codeValidation,
    inputValidationResultMiddleware,
  )
  .post(
    '/registration',
    loginValidation,
    emailValidation,
    passwordValidation,
    inputValidationResultMiddleware,
  )
  .post(
    '/registration-email-resending',
    emailValidation,
    inputValidationResultMiddleware,
  );
