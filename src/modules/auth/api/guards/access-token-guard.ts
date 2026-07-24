import { RequestHandler } from 'express';
import { jwtAdapter } from '../../adapters/jwt-adapter';

export const accessTokenGuard: RequestHandler = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send();
  }

  const [authType, token] = req.headers.authorization.split(' ');

  if (authType !== 'Bearer') {
    return res.status(401).send();
  }

  const payload = await jwtAdapter.verifyAccessToken(token);

  if (!payload) {
    return res.status(401).send();
  }

  const { userId } = payload;
  req.appContext = { ...req.appContext, user: { userId } };

  next();

  return;
};
