import type { DeviceRepository } from '../infrastructure/device-repository';

export class DeviceService {
  constructor(protected readonly deviceRepository: DeviceRepository) {}

  // public async createDevice() {}
  // public async updateDevice() {}
  // public async deleteDevice() {}
}
