import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { UserInputDTO, UserOutputDTO } from '../types';
import type { UserService } from '../../domain/user-service';
import type { UserQueryRepository } from '../../infrastructure/user-query-repository';

export const createCreateUserHandler = ({
  userService,
  userQueryRepository,
}: {
  userService: UserService;
  userQueryRepository: UserQueryRepository;
}): RequestHandler<object, UserOutputDTO, UserInputDTO> => {
  return async (req, res) => {
    const { login, email, password } = matchedData<UserInputDTO>(req);
    const userId = await userService.createUser({ login, email, password });
    const user = await userQueryRepository.findUserById(userId);
    res.status(201).send(user);
  };
};
