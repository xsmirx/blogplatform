import { RequestHandler } from 'express';
import type { UserService } from '../../domain/user-service';
import { matchedData } from 'express-validator';

export const createDeleteUserHandler = ({
  userService,
}: {
  userService: UserService;
}): RequestHandler<{ id: string }> => {
  return async (req, res) => {
    const { id: userId } = matchedData<{ id: string }>(req);
    await userService.deleteUser(userId);
    return res.sendStatus(204);
  };
};
