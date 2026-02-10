import jwt from 'jsonwebtoken';
import { settings } from '../settings/settings';

class JwtService {
  public async generateToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, settings.AC_TOKEN_SECRET, {
      expiresIn: settings.AC_TOKEN_TIME,
    });
  }

  public async verifyToken(token: string): Promise<{ userId: string } | null> {
    try {
      return jwt.verify(token, settings.AC_TOKEN_SECRET) as { userId: string };
    } catch {
      console.error('Token verify some error');
      return null;
    }
  }
}

export const jwtService = new JwtService();
