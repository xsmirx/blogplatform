import { RequestHandler } from 'express';
import { inject, injectable } from 'inversify';
import { ListResponse } from '../../../core/types/list-response';
import { UserInputDTO, UserListQueryInput, UserOutputDTO } from './types';
import { matchedData } from 'express-validator';
import { UserQueryRepository } from '../infrastructure/user-query-repository';
import { UserService } from '../domain/user-service';
import { UniqueConstraintError } from '../../../core/errors/domain-errors';
import { ValidationError } from '../../../core/errors/api-errors';

@injectable()
export class UserContoller {
  constructor(
    @inject(UserService) protected readonly userService: UserService,
    @inject(UserQueryRepository)
    protected readonly userQueryRepository: UserQueryRepository,
  ) {}

  public getUserList: RequestHandler<object, ListResponse<UserOutputDTO>> =
    async (req, res) => {
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

      const users = await this.userQueryRepository.findAll({
        pageNumber,
        pageSize,
        searchLoginTerm,
        searchEmailTerm,
        sortBy,
        sortDirection,
      });
      return res.status(200).send(users);
    };

  public createUser: RequestHandler<object, UserOutputDTO, UserInputDTO> =
    async (req, res) => {
      const { login, email, password } = matchedData<UserInputDTO>(req);
      try {
        const userId = await this.userService.createUser({
          login,
          email,
          password,
        });
        const user = await this.userQueryRepository.findById(userId);
        if (!user)
          throw new Error(
            `User ${userId} was created but not found - DB inconsistency`,
          );

        return res.status(201).send(user);
      } catch (e) {
        if (e instanceof UniqueConstraintError) {
          throw new ValidationError([
            { field: e.paramKey, message: e.message },
          ]);
        }
        throw e;
      }
    };

  public deleteUser: RequestHandler<{ id: string }> = async (req, res) => {
    const { id: userId } = matchedData<{ id: string }>(req);
    await this.userService.deleteUser(userId);
    return res.sendStatus(204);
  };
}
