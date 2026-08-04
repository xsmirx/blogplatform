import type { RequestHandler } from 'express';
import { DeviceService } from '../../domain/device-service';

export const createDeleteAllDevicesHandler =
  ({ deviceService }: { deviceService: DeviceService }): RequestHandler =>
  async (req, res) => {
    const userId = req.appContext?.user?.userId as string;
    const currentDeviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;

    await deviceService.ensureActiveSession({
      deviceId: currentDeviceId,
      version,
    });

    await deviceService.terminateAllDevicesExceptCurrent({
      userId,
      currentDeviceId,
    });

    return res.status(204).send();
  };
