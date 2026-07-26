export type LoginInput = {
  loginOrEmail: string;
  password: string;
  ip: string;
  deviceName: string;
};

export type RefreshInput = {
  deviceId: string;
  iat: number;
  userId: string;
  ip: string;
  deviceName: string;
};
