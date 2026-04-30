import {
  ForbiddenError,
  NotFoundError,
} from '../../../core/errors/domain-errors';
import type { DeviceRepository } from '../infrastructure/device-repository';
import type {
  CreateDeviceInput,
  TerminateAllDevicesExceptCurrentInput,
  TerminateDeviceInput,
  UpdateDeviceInput,
} from './types';

export class DeviceService {
  private readonly deviceRepository: DeviceRepository;

  constructor(deps: { deviceRepository: DeviceRepository }) {
    this.deviceRepository = deps.deviceRepository;
  }

  public async createDevice({
    deviceId,
    userId,
    ip,
    deviceName,
    createdAt,
    expiresAt,
  }: CreateDeviceInput) {
    await this.deviceRepository.create({
      id: deviceId,
      userId,
      ip,
      deviceName,
      createdAt,
      expiresAt,
    });
  }

  public async updateDevice({
    deviceId,
    userId,
    ip,
    deviceName,
    iat,
    exp,
  }: UpdateDeviceInput) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) throw new NotFoundError('Device not found');
    if (device.userId !== userId) throw new ForbiddenError('Forbidden');

    if (device.ip !== ip) {
      // throw location error
    }

    if (device.deviceName !== deviceName) {
      // throw device name error
    }

    await this.deviceRepository.updateById(deviceId, {
      ip,
      deviceName,
      createdAt,
      expiresAt,
    });
  }

  public async terminateDevice({ userId, deviceId }: TerminateDeviceInput) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) throw new NotFoundError('Device not found');
    if (device.userId !== userId) throw new ForbiddenError('Forbidden');
    await this.deviceRepository.deleteById(deviceId);
  }

  public async terminateAllDevicesExceptCurrent({
    userId,
    currentDeviceId,
  }: TerminateAllDevicesExceptCurrentInput) {
    const devices = await this.deviceRepository.findByUserId(userId);
    const devicesToTerminate = devices.filter(
      (device) => device.id !== currentDeviceId,
    );
    await Promise.all(
      devicesToTerminate.map((device) =>
        this.deviceRepository.deleteById(device.id),
      ),
    );
  }
}
