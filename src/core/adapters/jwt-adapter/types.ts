import { JwtPayload } from 'jsonwebtoken';

export type AccessTokenPayload = {
  userId: string;
};

export type RefreshTokenPayload = {
  userId: string;
  deviceId: string;
  version: string;
};

export type VerifiedAccessTokenPayload = Pick<JwtPayload, 'iat' | 'exp'> &
  AccessTokenPayload;

export type VerifiedRefreshTokenPayload = Pick<JwtPayload, 'iat' | 'exp'> &
  RefreshTokenPayload;

export type TokenPair = {
  accessToken: {
    token: string;
    iat: number;
    exp: number;
  };
  refreshToken: {
    token: string;
    version: string;
    iat: number;
    exp: number;
  };
};
