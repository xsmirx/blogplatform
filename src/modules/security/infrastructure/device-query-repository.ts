import { inject, injectable } from 'inversify';
import { DatabaseConnection } from '../../../db/mongo.db';
import { DeviceOutputDTO } from '../api/types';
import { DeviceDB } from './types';

@injectable()
export class DeviceQueryRepository {
  constructor(
    @inject(DatabaseConnection)
    protected readonly databaseConnection: DatabaseConnection,
  ) {}

  private get collection() {
    return this.databaseConnection.getCollections().devicesCollection;
  }

  private mapToViewModel(device: DeviceDB): DeviceOutputDTO {
    return {
      ip: device.ip,
      title: device.deviceName,
      lastActiveDate: device.createdAt.toISOString(),
      deviceId: device._id,
    };
  }

  public async findAll({
    userId,
    currentDeviceId,
  }: {
    userId: string;
    currentDeviceId: string;
  }) {
    const devices = await this.collection.find({ userId }).toArray();

    return devices
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
