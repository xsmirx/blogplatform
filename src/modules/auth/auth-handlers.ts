import { RequestHandler } from 'express';
import {
  LoginInputDTO,
  LoginOutputDTO,
  MeOutputDTO,
  RegistrationInputDTO,
} from './types';
import { matchedData } from 'express-validator';
import { authService } from './auth-service';
import { userQueryRepository } from '../user/user-query-repository';
import { userRepository } from '../user/infrastructure/user-repository';
import { userService } from '../user/domain/user-service';

export const loginUserHandler: RequestHandler<
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

export const meHandler: RequestHandler<object, MeOutputDTO> = async (
  req,
  res,
) => {
  const userId = req.appContext?.user?.userId;

  if (userId === undefined) {
    res.sendStatus(401);
    return;
  }

  const user = await userQueryRepository.findMeById(userId);

  res.status(200).send(user);
};

export const registrationHandler: RequestHandler<
  object,
  object,
  RegistrationInputDTO
> = async (req, res) => {
  const { email, login, password } = matchedData<RegistrationInputDTO>(req);

  await userService.createUser({ email, login, password });
  res.status(204).send();
};
