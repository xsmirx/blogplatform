import { RequestHandler } from 'express';
import { JwtAdapter } from '../adapters/jwt-adapter/jwt-adapter';
import { UnauthorizedError } from '../errors/domain-errors';

export const createRefreshTokenGuard =
  ({ jwtAdapter }: { jwtAdapter: JwtAdapter }): RequestHandler =>
  (req, res, next) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new UnauthorizedError('bad refreshToken');
    }

    const payload = jwtAdapter.verifyRefreshToken(refreshToken);

    if (!payload) {
      throw new UnauthorizedError('bad refreshToken');
    }

    const { userId, deviceId } = payload;

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
