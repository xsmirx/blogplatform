import { RequestHandler } from 'express';
import { MeOutputDTO } from '../types';
import type { UserQueryRepository } from '../../../user/infrastructure/user-query-repository';

export const createMeHandler = ({
  userQueryRepository,
}: {
  userQueryRepository: UserQueryRepository;
}): RequestHandler<object, MeOutputDTO> => {
  return async (req, res) => {
    const userId = req.appContext?.user?.userId;

    if (userId === undefined) {
      res.sendStatus(401);
      return;
    }

    const user = await userQueryRepository.findMeById(userId);

    res.status(200).send(user);
  };
};
