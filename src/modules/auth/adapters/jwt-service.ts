import jwt, { type JwtPayload } from 'jsonwebtoken';
import { settings } from '../../../core/settings/settings';
import type { AccessTokenPayload, RefreshTokenPayload } from './types';

export class JwtService {
  public async generateAccessToken({
    userId,
  }: AccessTokenPayload): Promise<string> {
    return jwt.sign({ userId }, settings.AC_TOKEN_SECRET, {
      expiresIn: settings.AC_TOKEN_TIME,
    });
  }

  public async generateRefreshToken({
    userId,
    deviceId,
  }: RefreshTokenPayload): Promise<string> {
    return jwt.sign({ userId, deviceId }, settings.RC_TOKEN_SECRET, {
      expiresIn: settings.RC_TOKEN_TIME,
    });
  }

  public async verifyAccessToken(
    token: string,
  ): Promise<(JwtPayload & AccessTokenPayload) | null> {
    try {
      return jwt.verify(token, settings.AC_TOKEN_SECRET) as JwtPayload &
        AccessTokenPayload;
    } catch {
      return null;
    }
  }

  public async verifyRefreshToken(
    token: string,
  ): Promise<(JwtPayload & RefreshTokenPayload) | null> {
    try {
      return jwt.verify(token, settings.RC_TOKEN_SECRET) as JwtPayload &
        RefreshTokenPayload;
    } catch {
      return null;
    }
  }
}

export const jwtService = new JwtService();
