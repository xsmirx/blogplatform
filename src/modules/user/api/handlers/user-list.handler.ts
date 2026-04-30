import { RequestHandler } from 'express';
import { ListResponse } from '../../../../core/types/list-response';
import { matchedData } from 'express-validator';
import { UserOutputDTO, type UserListQueryInput } from '../types';
import type { UserQueryRepository } from '../../infrastructure/user-query-repository';

export const createUserListHandler = ({
  userQueryRepository,
}: {
  userQueryRepository: UserQueryRepository;
}): RequestHandler<object, ListResponse<UserOutputDTO>> => {
  return async (req, res) => {
    const {
      pageNumber,
      pageSize,
      searchLoginTerm,
      searchEmailTerm,
      sortBy,
      sortDirection,
    } = matchedData<UserListQueryInput>(req, {
      includeOptionals: true,
    });

    const users = await userQueryRepository.findAll({
      pageNumber,
      pageSize,
      searchLoginTerm,
      searchEmailTerm,
      sortBy,
      sortDirection,
    });
    return res.status(200).send(users);
  };
};
