import { type WithId } from 'mongodb';
import { DatabaseConnection } from '../../../bd/mongo.db';
import type { DeviceDB } from './types';
import type { Device } from '../domain/types';
import { DeviceRepository } from '../domain/ports/device-repository.interface';
import { injectable, inject } from 'inversify';

@injectable()
export class MongoDeviceRepository implements DeviceRepository {
  constructor(
    @inject(DatabaseConnection)
    protected readonly databaseConnection: DatabaseConnection,
  ) {}

  private get collection() {
    return this.databaseConnection.getCollections().devicesCollection;
  }

  private mapToDomain(doc: WithId<DeviceDB>): Device {
    return {
      id: doc._id,
      version: doc.version,
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

  public async findByUserId(userId: string): Promise<Device[]> {
    const cursor = this.collection.find({
      userId,
    });
    const results = await cursor.toArray();
    return results.map((doc) => this.mapToDomain(doc));
  }

  public async findByIdAndVersion(input: {
    id: string;
    version: string;
  }): Promise<Device | null> {
    const result = await this.collection.findOne({
      _id: input.id,
      version: input.version,
    });
    if (!result) {
      return null;
    } else {
      return this.mapToDomain(result);
    }
  }

  public async create(device: Device) {
    const result = await this.collection.insertOne({
      _id: device.id,
      version: device.version,
      userId: device.userId,
      ip: device.ip,
      deviceName: device.deviceName,
      createdAt: device.createdAt,
      expiresAt: device.expiresAt,
    });

    return result.insertedId;
  }

  public async update(
    filter: { id: string; version: string },
    device: Omit<Device, 'id'>,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      {
        _id: filter.id,
        userId: device.userId,
        version: filter.version,
      },
      {
        $set: {
          userId: device.userId,
          ip: device.ip,
          version: device.version,
          deviceName: device.deviceName,
          createdAt: device.createdAt,
          expiresAt: device.expiresAt,
        },
      },
    );

    return result.matchedCount > 0;
  }

  public async delete(deviceId: string) {
    const result = await this.collection.deleteOne({
      _id: deviceId,
    });

    return result.deletedCount > 0;
  }
}
