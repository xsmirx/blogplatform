import { Router } from 'express';
import { loginOrEmailValidation } from '../middlewares/login-or-email.validation';
import { passwordValidation } from '../../user/middlewares/user-password.validation';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { loginHandler } from './handlers/login.handler';
import { accessTokenGuard } from './guards/access-token-guard';
import { meHandler } from './handlers/me.handler';
import { codeValidation } from '../middlewares/code.validation';
import { loginValidation } from '../../user/middlewares/user-login.validation';
import { emailValidation } from '../../user/middlewares/user-email.validation';
import { passwordValidationForRegistration } from '../middlewares/password-registration.validation';

export const authRouter: Router = Router();

authRouter
  .post(
    '/login',
    loginOrEmailValidation,
    passwordValidation,
    inputValidationResultMiddleware,
    loginHandler,
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
    passwordValidationForRegistration,
    inputValidationResultMiddleware,
  )
  .post(
    '/registration-email-resending',
    emailValidation,
    inputValidationResultMiddleware,
  );
