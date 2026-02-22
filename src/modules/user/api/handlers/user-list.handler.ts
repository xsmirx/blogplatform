import { RequestHandler } from 'express';
import { ListResponse } from '../../../../core/types/list-response';
import { UserListQueryInput, UserOutputDTO } from '../../types/types';
import { matchedData } from 'express-validator';
import { userQueryRepository } from '../../infrastructure/user-query-repository';

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
