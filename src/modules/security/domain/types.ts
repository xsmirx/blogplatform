export type Device = {
  id: string;
  userId: string;
  ip: string;
  deviceName: string;
  createdAt: Date;
  expiresAt: Date;
};

export type CreateDeviceInput = {
  deviceId: string;
  userId: string;
  ip: string;
  deviceName: string;
  createdAt: Date;
  expiresAt: Date;
};

export type UpdateDeviceInput = {
  deviceId: string;
  userId: string;
  ip?: string;
  deviceName?: string;
  expiresAt?: Date;
};

export type TerminateDeviceInput = {
  userId: string;
  deviceId: string;
};

export type TerminateAllDevicesExceptCurrentInput = {
  userId: string;
  currentDeviceId: string;
};
