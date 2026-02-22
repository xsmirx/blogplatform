import { RequestHandler } from 'express';
import { LoginInputDTO, LoginOutputDTO } from '../types';
import { matchedData } from 'express-validator';
import { authService } from '../../domain/auth-service';

export const loginHandler: RequestHandler<
  object,
  LoginOutputDTO,
  LoginInputDTO
> = async (req, res) => {
  const body = matchedData<LoginInputDTO>(req);
  const accessToken = await authService.login({
    loginOrEmail: body.loginOrEmail,
    password: body.password,
  });
  res.status(200).send({ accessToken });
};
