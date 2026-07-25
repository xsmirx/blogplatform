import { RequestHandler } from 'express';
import type { UserQueryRepository } from '../../../user/infrastructure/user-query-repository';
import { UnauthorizedError } from '../../../../core/errors/domain-errors';
import { MeOutputDTO } from '../../../user/api/types';

export const createMeHandler = ({
  userQueryRepository,
}: {
  userQueryRepository: UserQueryRepository;
}): RequestHandler<object, MeOutputDTO> => {
  return async (req, res) => {
    const userId = req.appContext?.user?.userId as string;

    const user = await userQueryRepository.findMeById(userId);

    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    return res.status(200).send(user);
  };
};
