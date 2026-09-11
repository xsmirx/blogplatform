import type { Device } from '../domain/types';
import { DeviceRepository } from '../domain/ports/device-repository.interface';
import { injectable, inject } from 'inversify';
import { DEVICE_MODEL } from './device-model';
import { Model } from 'mongoose';
import { DeviceDocument, DeviceInput } from './types';

@injectable()
export class MongoDeviceRepository implements DeviceRepository {
  constructor(
    @inject(DEVICE_MODEL)
    protected readonly deviceModel: Model<DeviceInput>,
  ) {}

  private mapToDomain(doc: DeviceDocument): Device {
    return {
      id: doc.id,
      version: doc.version.toString(),
      userId: doc.userId.toString(),
      ip: doc.ip,
      deviceName: doc.deviceName,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
    };
  }

  public async findById(deviceId: string): Promise<Device | null> {
    const result = await this.deviceModel.findById(deviceId);
    if (!result) return null;
    return this.mapToDomain(result);
  }

  public async findByUserId(userId: string): Promise<Device[]> {
    const query = this.deviceModel.find({
      userId,
    });
    const result = await query.exec();

    return result.map((doc) => this.mapToDomain(doc));
  }

  public async findByIdAndVersion(input: {
    id: string;
    version: string;
  }): Promise<Device | null> {
    const result = await this.deviceModel
      .findById(input.id)
      .where('version')
      .equals(input.version);
    if (!result) {
      return null;
    } else {
      return this.mapToDomain(result);
    }
  }

  public async create(device: Device) {
    const result = await this.deviceModel.create({
      _id: device.id,
      version: device.version,
      userId: device.userId,
      ip: device.ip,
      deviceName: device.deviceName,
      expiresAt: device.expiresAt,
    });
    return result.id;
  }

  public async update(
    filter: { id: string; version: string },
    device: Omit<Device, 'id'>,
  ): Promise<boolean> {
    const result = await this.deviceModel
      .findByIdAndUpdate(filter.id)
      .where('userId')
      .equals(device.userId)
      .where('version')
      .equals(filter.version)
      .set({
        userId: device.userId,
        ip: device.ip,
        version: device.version,
        deviceName: device.deviceName,
        expiresAt: device.expiresAt,
      });

    return result !== null;
  }

  public async delete(deviceId: string) {
    const result = await this.deviceModel.findByIdAndDelete(deviceId);
    return result !== null;
  }
}
