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
  pageNumberValidation,
  pageSizeValidation,
  passwordValidation,
  searchEmailTermValidation,
  searchLoginTermValidation,
  sortByValidation,
  sortDirectionValidation,
} from './user-validators';
import { inputValidationResultMiddleware } from '../../core/middleware/input-validation-result.middleware';

export const userRouter: Router = Router();

userRouter
  .get(
    '/',
    superAdminGuardMiddleware,
    searchLoginTermValidation,
    searchEmailTermValidation,
    pageNumberValidation,
    pageSizeValidation,
    sortByValidation,
    sortDirectionValidation,
    inputValidationResultMiddleware,
    getUserListHandler,
  )
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
