import { RequestHandler } from 'express';
import { JwtAdapter } from '../adapters/jwt-adapter';
import { UnauthorizedError } from '../errors/domain-errors';

export const createRefreshTokenGuard =
  ({ jwtAdapter }: { jwtAdapter: JwtAdapter }): RequestHandler =>
  async (req, res, next) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedError('bad refreshToken');
    }

    const payload = jwtAdapter.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedError('bad refreshToken');
    }

    const { userId, deviceId, exp } = payload;

    if (!exp || exp < Date.now()) {
      throw new UnauthorizedError('bad refreshToken');
    }

    if (!deviceId) {
      throw new UnauthorizedError('bad refreshToken');
    }

    req.appContext = {
      ...req.appContext,
      user: { userId },
      device: { deviceId },
    };

    next();

    return;
  };
