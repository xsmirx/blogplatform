import { Router } from 'express';
import { loginOrEmailValidation } from '../middlewares/login-or-email.validation';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { createLoginHandler } from './handlers/login.handler';
import { createMeHandler } from './handlers/me.handler';
import type { UserQueryRepository } from '../../user/infrastructure/user-query-repository';
import { codeValidation } from '../middlewares/code.validation';
import { loginValidation } from '../../user/middlewares/user-login.validation';
import { emailValidation } from '../../user/middlewares/user-email.validation';
import { passwordValidationForRegistration } from '../middlewares/password-registration.validation';
import { passwordLoginValidation } from '../middlewares/password-login.validation';
import { createRegistrationHandler } from './handlers/register.handler';
import { createRegistrationEmailResendHandler } from './handlers/registrationEmailResend.handler';
import { createRegistrationConfirmationHandler } from './handlers/registrationConfirmation.handler';
import type { AuthService } from '../domain/auth-service';
import { createRefreshTokenHandler } from './handlers/refreshToken.handler';
import { createLogoutHandler } from './handlers/logout.handler';
import { createAccessTokenGuard } from '../../../core/guards/access-token-guard';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';
import { createRefreshTokenGuard } from '../../../core/guards/refresh-token-guard';
import { RegistrationService } from '../../registration/domain/registrarion-service';
import { createRateLimiter } from '../../rateLimiting/api/guargs/rate-limiter';
import { RateLimitingService } from '../../rateLimiting/domain/rate-limiting-service';

export const createAuthRouter = ({
  rateLimitingService,
  authService,
  userQueryRepository,
  registrationService,
  jwtAdapter,
}: {
  rateLimitingService: RateLimitingService;
  authService: AuthService;
  userQueryRepository: UserQueryRepository;
  registrationService: RegistrationService;
  jwtAdapter: JwtAdapter;
}) => {
  const authRouter: Router = Router();

  authRouter
    .post(
      '/login',
      createRateLimiter(
        { rateLimitingService },
        { maxRequests: 5, windowMs: 10000 },
      ),
      loginOrEmailValidation,
      passwordLoginValidation,
      inputValidationResultMiddleware,
      createLoginHandler({ authService }),
    )
    .post(
      '/refresh-token',
      createRefreshTokenGuard({ jwtAdapter }),
      createRefreshTokenHandler({ authService }),
    )
    .post(
      '/registration-confirmation',
      createRateLimiter(
        { rateLimitingService },
        { maxRequests: 5, windowMs: 10000 },
      ),
      codeValidation,
      inputValidationResultMiddleware,
      createRegistrationConfirmationHandler({ registrationService }),
    )
    .post(
      '/registration',
      createRateLimiter(
        { rateLimitingService },
        { maxRequests: 5, windowMs: 10000 },
      ),
      loginValidation,
      emailValidation,
      passwordValidationForRegistration,
      inputValidationResultMiddleware,
      createRegistrationHandler({ registrationService }),
    )
    .post(
      '/registration-email-resending',
      createRateLimiter(
        { rateLimitingService },
        { maxRequests: 5, windowMs: 10000 },
      ),
      emailValidation,
      inputValidationResultMiddleware,
      createRegistrationEmailResendHandler({ registrationService }),
    )
    .post(
      '/logout',
      createRefreshTokenGuard({ jwtAdapter }),
      createLogoutHandler({ authService }),
    )
    .get(
      '/me',
      createAccessTokenGuard({ jwtAdapter }),
      createMeHandler({ userQueryRepository }),
    );

  return authRouter;
};
