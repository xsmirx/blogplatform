import { RequestHandler } from 'express';
import { UserInputDTO, UserOutputDTO } from '../../types/types';
import { userService } from '../../domain/user-service';
import { userQueryRepository } from '../../infrastructure/user-query-repository';

export const createUserHandler: RequestHandler<
  unknown,
  UserOutputDTO,
  UserInputDTO
> = async (req, res) => {
  const { login, email, password } = req.body;
  const userId = await userService.createUser({ login, email, password });
  const user = await userQueryRepository.findUserById(userId);
  res.status(201).send(user);
};
