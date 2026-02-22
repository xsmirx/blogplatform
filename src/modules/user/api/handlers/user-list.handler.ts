import { RequestHandler } from 'express';
import { ListResponse } from '../../../../core/types/list-response';
import { matchedData } from 'express-validator';
import { userQueryRepository } from '../../infrastructure/user-query-repository';
import { UserListQueryInput } from '../../infrastructure/types';
import { UserOutputDTO } from '../types';

export const userListHandler: RequestHandler<
  object,
  ListResponse<UserOutputDTO>
> = async (req, res) => {
  const queries = matchedData<UserListQueryInput>(req, {
    includeOptionals: true,
  });

  const users = await userQueryRepository.findAll(queries);
  res.status(200).send(users);
};
