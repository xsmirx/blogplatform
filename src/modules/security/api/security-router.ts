import { Router } from 'express';
import { createRefreshTokenGuard } from '../../../core/guards/refresh-token-guard';
import { deviceIdValidationParam } from '../middlewares/device-id.validation';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { Container } from 'inversify';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';
import { SecurityController } from './security-controller';

export const createSecurityRouter = (container: Container) => {
  const securityController = container.get(SecurityController);
  const securityRouter: Router = Router();

  securityRouter
    .get(
      '/devices',
      createRefreshTokenGuard({ jwtAdapter: container.get(JwtAdapter) }),
      securityController.getDeviceList,
    )
    .delete(
      '/devices',
      createRefreshTokenGuard({ jwtAdapter: container.get(JwtAdapter) }),
      securityController.deleteAllDevices,
    )
    .delete(
      '/devices/:deviceId',
      deviceIdValidationParam,
      inputValidationResultMiddleware,
      createRefreshTokenGuard({ jwtAdapter: container.get(JwtAdapter) }),
      securityController.deleteDevice,
    );

  return securityRouter;
};
