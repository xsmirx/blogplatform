import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '../../../core/errors/domain-errors';
import { DeviceRepository } from './ports/device-repository.interface';
import type {
  CreateDeviceInput,
  Device,
  TerminateAllDevicesExceptCurrentInput,
  TerminateDeviceInput,
  UpdateDeviceInput,
} from './types';

export class DeviceService {
  private readonly deviceRepository: DeviceRepository;

  constructor(deps: { deviceRepository: DeviceRepository }) {
    this.deviceRepository = deps.deviceRepository;
  }

  public async ensureActiveSession({
    deviceId,
    version,
  }: {
    deviceId: string;
    version: string;
  }): Promise<Device> {
    const result = await this.deviceRepository.findByIdAndVersion({
      id: deviceId,
      version,
    });
    if (!result) {
      throw new UnauthorizedError('Unauthorized');
    } else {
      return result;
    }
  }

  public async createDevice(device: CreateDeviceInput): Promise<string> {
    const deviceId = await this.deviceRepository.create({
      id: device.deviceId,
      version: device.version,
      userId: device.userId,
      ip: device.ip,
      deviceName: device.deviceName,
      createdAt: device.createdAt,
      expiresAt: device.expiresAt,
    });
    return deviceId;
  }

  public async updateDevice(
    { id, version }: { id: string; version: string },
    device: UpdateDeviceInput,
  ): Promise<void> {
    const result = await this.deviceRepository.update({ id, version }, device);
    if (!result) {
      throw new UnauthorizedError('Device not found');
    }
  }

  public async terminateSession({
    deviceId,
  }: {
    deviceId: string;
  }): Promise<void> {
    await this.deviceRepository.delete(deviceId);
  }

  public async terminateDevice({ userId, deviceId }: TerminateDeviceInput) {
    const device = await this.deviceRepository.findById(deviceId);
    if (!device) throw new NotFoundError('Device not found');
    if (device.userId !== userId) throw new ForbiddenError('Forbidden');
    await this.deviceRepository.delete(deviceId);
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
        this.deviceRepository.delete(device.id),
      ),
    );
  }
}
