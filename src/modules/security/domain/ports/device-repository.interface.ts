import { Device } from '../types';

export interface DeviceRepository {
  findById(id: string): Promise<Device | null>;
  findByUserId(userId: string): Promise<Device[]>;
  create(device: Device): Promise<string>;
  update(
    filter: { id: string; iat: number },
    device: Omit<Device, 'id'>,
  ): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
