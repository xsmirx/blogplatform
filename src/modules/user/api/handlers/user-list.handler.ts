import { RequestHandler } from 'express';
import { ListResponse } from '../../../../core/types/list-response';
import { matchedData } from 'express-validator';
import { UserListQueryInput } from '../../infrastructure/types';
import { UserOutputDTO } from '../types';
import type { UserQueryRepository } from '../../infrastructure/user-query-repository';

export const createUserListHandler = ({
  userQueryRepository,
}: {
  userQueryRepository: UserQueryRepository;
}): RequestHandler<object, ListResponse<UserOutputDTO>> => {
  return async (req, res) => {
    const queries = matchedData<UserListQueryInput>(req, {
      includeOptionals: true,
    });

    const users = await userQueryRepository.findAll(queries);
    res.status(200).send(users);
  };
};
