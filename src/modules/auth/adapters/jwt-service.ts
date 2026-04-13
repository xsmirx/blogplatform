import jwt from 'jsonwebtoken';
import { settings } from '../../../core/settings/settings';

export class JwtService {
  public async generateAccessToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, settings.AC_TOKEN_SECRET, {
      expiresIn: settings.AC_TOKEN_TIME,
    });
  }

  public async generateRefreshToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, settings.RC_TOKEN_SECRET, {
      expiresIn: settings.RC_TOKEN_TIME,
    });
  }

  public async verifyAccessToken(
    token: string,
  ): Promise<{ userId: string } | null> {
    try {
      return jwt.verify(token, settings.AC_TOKEN_SECRET) as { userId: string };
    } catch {
      return null;
    }
  }

  public async verifyRefreshToken(
    token: string,
  ): Promise<{ userId: string } | null> {
    try {
      return jwt.verify(token, settings.RC_TOKEN_SECRET) as { userId: string };
    } catch {
      return null;
    }
  }
}

export const jwtService = new JwtService();
