import { Router } from 'express';
import {
  createUserHandler,
  deleteUserHandler,
  getUserListHandler,
} from './user-handlers';
import { superAdminGuard } from '../auth/super-admin-guard';
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
    superAdminGuard,
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
    superAdminGuard,
    loginValidation,
    passwordValidation,
    emailValidation,
    inputValidationResultMiddleware,
    createUserHandler,
  )
  .delete(
    '/:id',
    superAdminGuard,
    idValidation,
    inputValidationResultMiddleware,
    deleteUserHandler,
  );
