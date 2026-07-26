import jwt, { type JwtPayload } from 'jsonwebtoken';
import { settings } from '../../settings/settings';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  VerifiedAccessTokenPayload,
  VerifiedRefreshTokenPayload,
} from './types';

export class JwtAdapter {
  public generateAccessToken({ userId }: AccessTokenPayload): string {
    return jwt.sign({ userId }, settings.AC_TOKEN_SECRET, {
      expiresIn: settings.AC_TOKEN_TIME,
    });
  }

  public generateRefreshToken({
    userId,
    deviceId,
  }: RefreshTokenPayload): string {
    return jwt.sign({ userId, deviceId }, settings.RC_TOKEN_SECRET, {
      expiresIn: settings.RC_TOKEN_TIME,
    });
  }

  public generateTokenPair({
    userId,
    deviceId,
  }: {
    userId: string;
    deviceId: string;
  }): TokenPair {
    return {
      accessToken: this.generateAccessToken({ userId }),
      refreshToken: this.generateRefreshToken({ userId, deviceId }),
    };
  }

  public verifyAccessToken(
    token: string,
  ): (JwtPayload & AccessTokenPayload) | null {
    try {
      return jwt.verify(
        token,
        settings.AC_TOKEN_SECRET,
      ) as VerifiedAccessTokenPayload;
    } catch {
      return null;
    }
  }

  public verifyRefreshToken(token: string) {
    try {
      return jwt.verify(
        token,
        settings.RC_TOKEN_SECRET,
      ) as VerifiedRefreshTokenPayload;
    } catch {
      return null;
    }
  }
}
