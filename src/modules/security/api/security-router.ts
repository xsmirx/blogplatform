import { Router } from 'express';
import { createGetDeviceListHandler } from './handlers/getDeviceListHandler';
import { createDeleteAllDevicesHandler } from './handlers/deleteAllDevicesHandler';
import { createDeleteDeviceHandler } from './handlers/deleteDeviceHandler';

export const createSecurityRouter = () => {
  const securityRouter: Router = Router();

  securityRouter
    .get('/devices', createGetDeviceListHandler())
    .delete('/devices', createDeleteAllDevicesHandler())
    .delete('/devices/:deviceId', createDeleteDeviceHandler());

  return securityRouter;
};
