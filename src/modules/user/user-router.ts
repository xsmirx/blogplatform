import { Router } from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  getUserListHandler,
} from './user-handlers';

export const userRouter: Router = Router();

userRouter
  .get('/', getUserListHandler)
  .post('/', createUserHandler)
  .delete('/:id', deleteUserHandler);
