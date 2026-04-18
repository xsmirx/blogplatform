export type SessionDB = {
  userId: string;
  ip: string;
  deviceName: string;
  createdAt: Date;
  expiresAt: Date;
};

export type Session = {
  id: string;
  userId: string;
  ip: string;
  deviceName: string;
  createdAt: Date;
  expiresAt: Date;
};
