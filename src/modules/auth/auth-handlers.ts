import { RequestHandler } from 'express';
import { LoginInputDTO } from './types';
import { matchedData } from 'express-validator';
import { authService } from './auth-service';

export const loginUserHandler: RequestHandler<
  object,
  object,
  LoginInputDTO
> = async (req, res) => {
  const body = matchedData<LoginInputDTO>(req);
  await authService.login({
    loginOrEmail: body.loginOrEmail,
    password: body.password,
  });
  res.status(204).send();
};
