import { RequestHandler } from 'express';
import { UserInputDTO, UserListPagQueryInput, UserOutputDTO } from './types';
import { userService } from './user-service';
import { userQueryRepository } from './user-query-repository';
import { ListResponse } from '../../core/types/list-response';
import { matchedData } from 'express-validator';

export const getUserListHandler: RequestHandler<
  object,
  ListResponse<UserOutputDTO>
> = async (req, res) => {
  const queries = matchedData<UserListPagQueryInput>(req, {
    includeOptionals: true,
  });

  const users = await userQueryRepository.findAll(queries);
  res.status(200).send(users);
};

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
