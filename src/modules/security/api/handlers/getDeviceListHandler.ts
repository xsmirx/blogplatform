import type { RequestHandler } from 'express';
import { DeviceQueryRepository } from '../../infrastructure/device-query-repository';
import { DeviceOutputDTO } from './types';

export const createGetDeviceListHandler =
  ({
    deviceQueryRepository,
  }: {
    deviceQueryRepository: DeviceQueryRepository;
  }): RequestHandler<undefined, DeviceOutputDTO[]> =>
  async (req, res) => {
    const userId = req.appContext?.user?.userId as string;
    const currentDeviceId = req.appContext?.device?.deviceId as string;

    const devices = await deviceQueryRepository.findAll({
      userId,
      currentDeviceId,
    });

    res.status(200).send(devices);
    return;
  };
