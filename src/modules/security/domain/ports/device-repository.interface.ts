import { Device } from '../types';

export interface DeviceRepository {
  findById(id: string): Promise<Device | null>;
  findByUserId(userId: string): Promise<Device[]>;

  create(device: Device): Promise<string>;

  deleteById(id: string): Promise<boolean>;
}
