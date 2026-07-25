import type { RequestHandler } from 'express';
import { DeviceService } from '../../domain/device-service';

export const createDeleteDeviceHandler =
  ({
    deviceService,
  }: {
    deviceService: DeviceService;
  }): RequestHandler<{ deviceId: string }> =>
  async (req, res) => {
    const userId = req.appContext?.user?.userId as string;
    const deviceId = req.params.deviceId;

    await deviceService.terminateDevice({ userId, deviceId });

    return res.status(204).send();
  };
