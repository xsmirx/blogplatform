import { RequestHandler } from 'express';
import { UserInputDTO, UserOutputDTO } from './types';
import { userService } from './user-service';
import { userQueryRepository } from './user-query-repository';

export const getUserListHandler: RequestHandler = (req, res) => {};

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

export const deleteUserHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const userId = req.params.id;
  await userService.deleteUser(userId);
  res.sendStatus(204);
};
