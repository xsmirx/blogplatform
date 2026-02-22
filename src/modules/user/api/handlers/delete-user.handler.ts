import { RequestHandler } from 'express';
import { userService } from '../../domain/user-service';

export const deleteUserHandler: RequestHandler<{ id: string }> = async (
  req,
  res,
) => {
  const userId = req.params.id;
  await userService.deleteUser(userId);
  res.sendStatus(204);
};
