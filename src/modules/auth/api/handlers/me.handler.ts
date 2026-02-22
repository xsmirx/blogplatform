import { RequestHandler } from 'express';
import { MeOutputDTO } from '../types';
import { userQueryRepository } from '../../../user/infrastructure/user-query-repository';

export const meHandler: RequestHandler<object, MeOutputDTO> = async (
  req,
  res,
) => {
  const userId = req.appContext?.user?.userId;

  if (userId === undefined) {
    res.sendStatus(401);
    return;
  }

  const user = await userQueryRepository.findMeById(userId);

  res.status(200).send(user);
};
