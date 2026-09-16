import { RequestHandler } from 'express';
import { JwtAdapter } from '../adapters/jwt-adapter/jwt-adapter';
import { extractAccessTokenPayload } from './utils/extract-access-token-payload';

export const createOptionalAccessTokenGuard =
  ({ jwtAdapter }: { jwtAdapter: JwtAdapter }): RequestHandler =>
  (req, res, next) => {
    const payload = extractAccessTokenPayload(req, jwtAdapter);

    if (payload) {
      const { userId } = payload;
      req.appContext = { ...req.appContext, user: { userId } };
    }

    next();

    return;
  };
