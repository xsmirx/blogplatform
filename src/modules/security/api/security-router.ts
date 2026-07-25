import { Router } from 'express';
import { createGetDeviceListHandler } from './handlers/getDeviceListHandler';
import { createDeleteAllDevicesHandler } from './handlers/deleteAllDevicesHandler';
import { createDeleteDeviceHandler } from './handlers/deleteDeviceHandler';
import { DeviceQueryRepository } from '../infrastructure/device-query-repository';
import { createRefreshTokenGuard } from '../../../core/guards/refresh-token-guard';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter';
import { DeviceService } from '../domain/device-service';

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
      createGetDeviceListHandler({ deviceQueryRepository }),
    )
    .delete(
      '/devices',
      createRefreshTokenGuard({ jwtAdapter }),
      createDeleteAllDevicesHandler({ deviceService }),
    )
    .delete(
      '/devices/:deviceId',
      createRefreshTokenGuard({ jwtAdapter }),
      createDeleteDeviceHandler({ deviceService }),
    );

  return securityRouter;
};
