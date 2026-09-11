import { inject, injectable } from 'inversify';
import { DeviceOutputDTO } from '../api/types';
import { DEVICE_MODEL } from './device-model';
import { Model } from 'mongoose';
import { DeviceDocument, DeviceInput } from './types';

@injectable()
export class DeviceQueryRepository {
  constructor(
    @inject(DEVICE_MODEL)
    protected readonly deviceModel: Model<DeviceInput>,
  ) {}

  private mapToViewModel(device: DeviceDocument): DeviceOutputDTO {
    return {
      ip: device.ip,
      title: device.deviceName,
      lastActiveDate: device.updatedAt.toISOString(),
      deviceId: device.id,
    };
  }

  public async findAll({
    userId,
    currentDeviceId,
  }: {
    userId: string;
    currentDeviceId: string;
  }) {
    const result = await this.deviceModel.find({ userId });

    return result
      .map((device) => this.mapToViewModel(device))
      .sort((a, b) =>
        a.deviceId === currentDeviceId
          ? -1
          : b.deviceId === currentDeviceId
            ? 1
            : 0,
      );
  }
}
