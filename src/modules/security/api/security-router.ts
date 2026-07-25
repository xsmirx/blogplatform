import { Router } from 'express';
import { createGetDeviceListHandler } from './handlers/getDeviceListHandler';
import { createDeleteAllDevicesHandler } from './handlers/deleteAllDevicesHandler';
import { createDeleteDeviceHandler } from './handlers/deleteDeviceHandler';
import { DeviceQueryRepository } from '../infrastructure/device-query-repository';
import { createRefreshTokenGuard } from '../../../core/guards/refresh-token-guard';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter';

export const createSecurityRouter = ({
  deviceQueryRepository,
  jwtAdapter,
}: {
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
    .delete('/devices', createDeleteAllDevicesHandler())
    .delete('/devices/:deviceId', createDeleteDeviceHandler());

  return securityRouter;
};
