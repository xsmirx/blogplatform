import { RequestHandler } from 'express';
import { JwtAdapter } from '../adapters/jwt-adapter/jwt-adapter';
import { UnauthorizedError } from '../errors/domain-errors';

export const createAccessTokenGuard =
  ({ jwtAdapter }: { jwtAdapter: JwtAdapter }): RequestHandler =>
  async (req, res, next) => {
    if (!req.headers.authorization) {
      throw new UnauthorizedError('bad accessToken');
    }

    const [authType, token] = req.headers.authorization.split(' ');

    if (authType !== 'Bearer') {
      throw new UnauthorizedError('bad accessToken');
    }

    const payload = jwtAdapter.verifyAccessToken(token);

    if (!payload) {
      throw new UnauthorizedError('bad accessToken');
    }

    const { userId } = payload;
    req.appContext = { ...req.appContext, user: { userId } };

    next();

    return;
  };
