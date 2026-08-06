import { RequestHandler } from 'express';
import { inject, injectable } from 'inversify';
import { DeviceOutputDTO } from './types';
import { DeviceService } from '../domain/device-service';
import { DeviceQueryRepository } from '../infrastructure/device-query-repository';

@injectable()
export class SecurityController {
  constructor(
    @inject(DeviceService) protected readonly deviceService: DeviceService,
    @inject(DeviceQueryRepository)
    protected readonly deviceQueryRepository: DeviceQueryRepository,
  ) {}

  getDeviceList: RequestHandler<object, DeviceOutputDTO[]> = async (
    req,
    res,
  ) => {
    const userId = req.appContext?.user?.userId as string;
    const currentDeviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;

    await this.deviceService.ensureActiveSession({
      deviceId: currentDeviceId,
      version,
    });

    const devices = await this.deviceQueryRepository.findAll({
      userId,
      currentDeviceId,
    });

    res.status(200).send(devices);
    return;
  };

  deleteDevice: RequestHandler<{ deviceId: string }> = async (req, res) => {
    const userId = req.appContext?.user?.userId as string;
    const deviceId = req.params.deviceId;
    const currentDeviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;

    await this.deviceService.ensureActiveSession({
      deviceId: currentDeviceId,
      version,
    });
    await this.deviceService.terminateDevice({ userId, deviceId });

    return res.status(204).send();
  };

  deleteAllDevices: RequestHandler = async (req, res) => {
    const userId = req.appContext?.user?.userId as string;
    const currentDeviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;

    await this.deviceService.ensureActiveSession({
      deviceId: currentDeviceId,
      version,
    });

    await this.deviceService.terminateAllDevicesExceptCurrent({
      userId,
      currentDeviceId,
    });

    return res.status(204).send();
  };
}
