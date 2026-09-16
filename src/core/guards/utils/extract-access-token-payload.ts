import { Request } from 'express';
import { JwtAdapter } from '../../adapters/jwt-adapter/jwt-adapter';

export const extractAccessTokenPayload = (
  req: Request,
  jwtAdapter: JwtAdapter,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const [authType, token] = authHeader.split(' ');

  if (authType !== 'Bearer' || !token) {
    return null;
  }

  return jwtAdapter.verifyAccessToken(token);
};
