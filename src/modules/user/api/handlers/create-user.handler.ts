import { RequestHandler } from 'express';
import { userService } from '../../domain/user-service';
import { userQueryRepository } from '../../infrastructure/user-query-repository';
import { matchedData } from 'express-validator';
import { UserInputDTO, UserOutputDTO } from '../types';

export const createUserHandler: RequestHandler<
  object,
  UserOutputDTO,
  UserInputDTO
> = async (req, res) => {
  const { login, email, password } = matchedData<UserInputDTO>(req);
  const userId = await userService.createUser({ login, email, password });
  const user = await userQueryRepository.findUserById(userId);
  res.status(201).send(user);
};
