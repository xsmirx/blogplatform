import { Router } from 'express';
import { loginOrEmailValidation } from '../middlewares/login-or-email.validation';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { codeValidation } from '../middlewares/code.validation';
import { loginValidation } from '../../user/middlewares/user-login.validation';
import { emailValidation } from '../../user/middlewares/user-email.validation';
import { passwordValidationForRegistration } from '../middlewares/password-registration.validation';
import { passwordLoginValidation } from '../middlewares/password-login.validation';
import { createAccessTokenGuard } from '../../../core/guards/access-token-guard';
import { createRefreshTokenGuard } from '../../../core/guards/refresh-token-guard';
import { createRateLimiter } from '../../rateLimiting/api/guargs/rate-limiter';
import { Container } from 'inversify';
import { AuthController } from './auth-controller';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';
import { RateLimitingService } from '../../rateLimiting/domain/rate-limiting-service';

export const createAuthRouter = (container: Container) => {
  const authController = container.get(AuthController);
  const rateLimitingService = container.get(RateLimitingService);
  const jwtAdapter = container.get(JwtAdapter);

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
      authController.login,
    )
    .post(
      '/refresh-token',
      createRefreshTokenGuard({ jwtAdapter }),
      authController.refreshToken,
    )
    .post(
      '/registration-confirmation',
      createRateLimiter(
        { rateLimitingService },
        { maxRequests: 5, windowMs: 10000 },
      ),
      codeValidation,
      inputValidationResultMiddleware,
      authController.confirmRegistration,
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
      authController.registration,
    )
    .post(
      '/registration-email-resending',
      createRateLimiter(
        { rateLimitingService },
        { maxRequests: 5, windowMs: 10000 },
      ),
      emailValidation,
      inputValidationResultMiddleware,
      authController.resendRegistrationEmail,
    )
    .post(
      '/logout',
      createRefreshTokenGuard({ jwtAdapter }),
      authController.logout,
    )
    .get('/me', createAccessTokenGuard({ jwtAdapter }), authController.me);

  return authRouter;
};
