import { Device } from '../types';

export interface DeviceRepository {
  findById(id: string): Promise<Device | null>;
  findByUserId(userId: string): Promise<Device[]>;

  deleteById(id: string): Promise<boolean>;
}
