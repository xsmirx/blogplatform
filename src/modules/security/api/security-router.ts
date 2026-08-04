import { Router } from 'express';
import { createGetDeviceListHandler } from './handlers/getDeviceListHandler';
import { createDeleteAllDevicesHandler } from './handlers/deleteAllDevicesHandler';
import { createDeleteDeviceHandler } from './handlers/deleteDeviceHandler';
import { DeviceQueryRepository } from '../infrastructure/device-query-repository';
import { createRefreshTokenGuard } from '../../../core/guards/refresh-token-guard';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter/jwt-adapter';
import { DeviceService } from '../domain/device-service';
import { deviceIdValidationParam } from '../middlewares/device-id.validation';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';

export const createSecurityRouter = ({
  deviceService,
  deviceQueryRepository,
  jwtAdapter,
}: {
  deviceService: DeviceService;
  deviceQueryRepository: DeviceQueryRepository;
  jwtAdapter: JwtAdapter;
}) => {
  const securityRouter: Router = Router();

  securityRouter
    .get(
      '/devices',
      createRefreshTokenGuard({ jwtAdapter }),
      createGetDeviceListHandler({ deviceService, deviceQueryRepository }),
    )
    .delete(
      '/devices',
      createRefreshTokenGuard({ jwtAdapter }),
      createDeleteAllDevicesHandler({ deviceService }),
    )
    .delete(
      '/devices/:deviceId',
      deviceIdValidationParam,
      inputValidationResultMiddleware,
      createRefreshTokenGuard({ jwtAdapter }),
      createDeleteDeviceHandler({ deviceService }),
    );

  return securityRouter;
};
