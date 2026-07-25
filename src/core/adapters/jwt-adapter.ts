import jwt, { type JwtPayload } from 'jsonwebtoken';
import { settings } from '../settings/settings';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../../modules/auth/adapters/types';

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

  public verifyAccessToken(
    token: string,
  ): (JwtPayload & AccessTokenPayload) | null {
    try {
      return jwt.verify(token, settings.AC_TOKEN_SECRET) as JwtPayload &
        AccessTokenPayload;
    } catch {
      return null;
    }
  }

  public verifyRefreshToken(
    token: string,
  ): (JwtPayload & RefreshTokenPayload) | null {
    try {
      return jwt.verify(token, settings.RC_TOKEN_SECRET) as JwtPayload &
        RefreshTokenPayload;
    } catch {
      return null;
    }
  }
}
