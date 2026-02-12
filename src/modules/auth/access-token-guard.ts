import { RequestHandler } from 'express';
import { jwtService } from '../../core/adapters/jwt-service';

export const accessTokenGuard: RequestHandler = async (req, res, next) => {
  if (!req.headers.authorization) {
    return res.status(401).send();
  }

  const [authType, token] = req.headers.authorization.split(' ');

  if (authType !== 'Bearer') {
    return res.status(401).send();
  }

  const payload = await jwtService.verifyToken(token);

  if (!payload) {
    return res.status(401).send();
  }

  const { userId } = payload;
  req.appContext = { ...req.appContext, user: { userId } };

  next();

  return;
};
