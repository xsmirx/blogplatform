import { Router } from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  getUserListHandler,
} from './user-handlers';
import { superAdminGuardMiddleware } from '../auth/super-admin-guard.middleware';
import {
  emailValidation,
  idValidation,
  loginValidation,
  passwordValidation,
} from './user-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';

export const userRouter: Router = Router();

userRouter
  .get('/', superAdminGuardMiddleware, getUserListHandler)
  .post(
    '/',
    superAdminGuardMiddleware,
    loginValidation,
    passwordValidation,
    emailValidation,
    inputValidationResultMiddleware,
    createUserHandler,
  )
  .delete(
    '/:id',
    superAdminGuardMiddleware,
    idValidation,
    inputValidationResultMiddleware,
    deleteUserHandler,
  );
