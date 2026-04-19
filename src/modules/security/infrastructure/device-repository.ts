import { type WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { Device, DeviceDB } from './types';

export class DeviceRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().devicesCollection;
  }

  private mapToDomain(doc: WithId<DeviceDB>): Device {
    return {
      id: doc._id,
      userId: doc.userId,
      ip: doc.ip,
      deviceName: doc.deviceName,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
    };
  }

  public async findById(deviceId: string): Promise<Device | null> {
    const result = await this.collection.findOne({
      _id: deviceId,
    });
    if (!result) return null;

    return this.mapToDomain(result);
  }

  public async create(device: Device) {
    const result = await this.collection.insertOne({
      _id: device.id,
      userId: device.userId,
      ip: device.ip,
      deviceName: device.deviceName,
      createdAt: device.createdAt,
      expiresAt: device.expiresAt,
    });

    return result.insertedId;
  }

  public async updateById(
    deviceId: string,
    device: Partial<Omit<DeviceDB, '_id'>>,
  ) {
    const result = await this.collection.updateOne(
      { _id: deviceId },
      { $set: device },
    );

    return result.matchedCount > 0;
  }

  public async deleteById(deviceId: string) {
    const result = await this.collection.deleteOne({
      _id: deviceId,
    });

    return result.deletedCount > 0;
  }
}
