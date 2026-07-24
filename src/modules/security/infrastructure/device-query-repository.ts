import { DatabaseConnection } from '../../../bd/mongo.db';
import { DeviceOutputDTO } from '../api/handlers/types';
import { DeviceDB } from './types';

export class DeviceQueryRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

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
      .map(this.mapToViewModel)
      .sort((a) => (a.deviceId === currentDeviceId ? 1 : 0));
  }
}
