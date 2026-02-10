import jwt from 'jsonwebtoken';
import { settings } from '../settings/settings';

class JwtService {
  public async generateToken(userId: string): Promise<string> {
    return jwt.sign({ userId }, settings.AC_TOKEN_SECRET, {
      expiresIn: settings.AC_TOKEN_TIME,
    });
  }
}

export const jwtService = new JwtService();
