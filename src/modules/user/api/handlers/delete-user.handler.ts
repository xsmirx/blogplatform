import { RequestHandler } from 'express';
import type { UserService } from '../../domain/user-service';

export const createDeleteUserHandler = ({
  userService,
}: {
  userService: UserService;
}): RequestHandler<{ id: string }> => {
  return async (req, res) => {
    const userId = req.params.id;
    await userService.deleteUser(userId);
    res.sendStatus(204);
  };
};
