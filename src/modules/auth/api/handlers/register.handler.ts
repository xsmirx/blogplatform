import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { userService } from '../../../user/domain/user-service';
import { RegistrationInputDTO } from '../types';

export const registrationHandler: RequestHandler<
  object,
  object,
  RegistrationInputDTO
> = async (req, res) => {
  const { email, login, password } = matchedData<RegistrationInputDTO>(req);

  await userService.createUser({ email, login, password });
  res.status(204).send();
};
