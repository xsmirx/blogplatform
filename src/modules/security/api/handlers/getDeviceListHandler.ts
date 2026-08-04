import type { RequestHandler } from 'express';
import { DeviceQueryRepository } from '../../infrastructure/device-query-repository';
import { DeviceOutputDTO } from './types';
import { DeviceService } from '../../domain/device-service';

export const createGetDeviceListHandler =
  ({
    deviceService,
    deviceQueryRepository,
  }: {
    deviceService: DeviceService;
    deviceQueryRepository: DeviceQueryRepository;
  }): RequestHandler<object, DeviceOutputDTO[]> =>
  async (req, res) => {
    const userId = req.appContext?.user?.userId as string;
    const currentDeviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;

    await deviceService.ensureActiveSession({
      deviceId: currentDeviceId,
      version,
    });

    const devices = await deviceQueryRepository.findAll({
      userId,
      currentDeviceId,
    });

    res.status(200).send(devices);
    return;
  };
