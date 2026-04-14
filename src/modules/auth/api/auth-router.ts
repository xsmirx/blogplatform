import { Router } from 'express';
import { loginOrEmailValidation } from '../middlewares/login-or-email.validation';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { createLoginHandler } from './handlers/login.handler';
import { accessTokenGuard } from './guards/access-token-guard';
import { createMeHandler } from './handlers/me.handler';
import type { UserQueryRepository } from '../../user/infrastructure/user-query-repository';
import { codeValidation } from '../middlewares/code.validation';
import { loginValidation } from '../../user/middlewares/user-login.validation';
import { emailValidation } from '../../user/middlewares/user-email.validation';
import { passwordValidationForRegistration } from '../middlewares/password-registration.validation';
import { passwordLoginValidation } from '../middlewares/password-login.validatiom';
import { createRegistrationHandler } from './handlers/register.handler';
import { createRegistrationEmailResendHandler } from './handlers/registrationEmailResend.handler';
import { createRegistrationConfirmationHandler } from './handlers/registrationConfirmation.handler';
import type { AuthService } from '../domain/auth-service';
import { createRefreshTokenHandler } from './handlers/refreshToken.handler';
import { createLogoutHandler } from './handlers/logout.handler';

export const createAuthRouter = ({
  authService,
  userQueryRepository,
}: {
  authService: AuthService;
  userQueryRepository: UserQueryRepository;
}) => {
  const authRouter: Router = Router();

  authRouter
    .post(
      '/login',
      loginOrEmailValidation,
      passwordLoginValidation,
      inputValidationResultMiddleware,
      createLoginHandler({ authService }),
    )
    .get('/me', accessTokenGuard, createMeHandler({ userQueryRepository }))
    .post(
      '/registration-confirmation',
      codeValidation,
      inputValidationResultMiddleware,
      createRegistrationConfirmationHandler({ authService }),
    )
    .post(
      '/registration',
      loginValidation,
      emailValidation,
      passwordValidationForRegistration,
      inputValidationResultMiddleware,
      createRegistrationHandler({ authService }),
    )
    .post(
      '/registration-email-resending',
      emailValidation,
      inputValidationResultMiddleware,
      createRegistrationEmailResendHandler({ authService }),
    )
    .post('/refresh-token', createRefreshTokenHandler({ authService }))
    .post('/logout', createLogoutHandler({ authService }));

  return authRouter;
};
