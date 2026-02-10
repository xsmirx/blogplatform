import { Router } from 'express';
import { loginUserHandler, meHandler } from './auth-handlers';
import { loginOrEmailValidation, passwordValidation } from './auth-validators';
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
  .get('/me', accessTokenGuard, meHandler);
