import { ServiceIdentifier } from 'inversify';
import { Device } from '../types';

export interface DeviceRepository {
  findById(id: string): Promise<Device | null>;
  findByUserId(userId: string): Promise<Device[]>;
  findByIdAndVersion(input: {
    id: string;
    version: string;
  }): Promise<Device | null>;
  create(device: Device): Promise<string>;
  update(
    filter: { id: string; version: string },
    device: Omit<Device, 'id'>,
  ): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}

export const DEVICE_REPOSITORY: ServiceIdentifier<DeviceRepository> =
  Symbol('DeviceRepository');
