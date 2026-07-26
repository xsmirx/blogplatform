import { JwtPayload } from 'jsonwebtoken';

export type AccessTokenPayload = {
  userId: string;
};

export type RefreshTokenPayload = {
  userId: string;
  deviceId: string;
};

export type VerifiedAccessTokenPayload = Required<
  Pick<JwtPayload, 'iat' | 'exp'>
> &
  AccessTokenPayload;

export type VerifiedRefreshTokenPayload = Required<
  Pick<JwtPayload, 'iat' | 'exp'>
> &
  RefreshTokenPayload;

export type TokenPair = { accessToken: string; refreshToken: string };
