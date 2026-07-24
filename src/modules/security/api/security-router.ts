import { Router } from 'express';
import { createGetDeviceListHandler } from './handlers/getDeviceListHandler';
import { createDeleteAllDevicesHandler } from './handlers/deleteAllDevicesHandler';
import { createDeleteDeviceHandler } from './handlers/deleteDeviceHandler';
import { DeviceQueryRepository } from '../infrastructure/device-query-repository';

export const createSecurityRouter = ({
  deviceQueryRepository,
}: {
  deviceQueryRepository: DeviceQueryRepository;
}) => {
  const securityRouter: Router = Router();

  securityRouter
    .get(
      '/devices',
      refreshTokenGuard(),
      createGetDeviceListHandler({ deviceQueryRepository }),
    )
    .delete('/devices', createDeleteAllDevicesHandler())
    .delete('/devices/:deviceId', createDeleteDeviceHandler());

  return securityRouter;
};
