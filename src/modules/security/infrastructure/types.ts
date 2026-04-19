export type DeviceDB = {
  _id: string;
  userId: string;
  ip: string;
  deviceName: string;
  createdAt: Date;
  expiresAt: Date;
};

export type Device = {
  id: string;
  userId: string;
  ip: string;
  deviceName: string;
  createdAt: Date;
  expiresAt: Date;
};
