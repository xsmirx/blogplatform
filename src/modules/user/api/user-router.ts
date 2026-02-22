import { Router } from 'express';

import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';

import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { searchLoginTermValidation } from '../middlewares/user-search-login-term.validation';
import { searchEmailTermValidation } from '../middlewares/user-search-email-term.validation';
import { pageNumberValidation } from '../middlewares/user-page-numer.validation';
import { pageSizeValidation } from '../middlewares/user-page-size.validation';
import { sortByValidation } from '../middlewares/user-sort-by.validation';
import { sortDirectionValidation } from '../middlewares/user-sort-direction.validation';
import { userListHandler } from './handlers/user-list.handler';
import { loginValidation } from '../middlewares/user-login.validation';
import { passwordValidation } from '../middlewares/user-password.validation';
import { emailValidation } from '../middlewares/user-email.validation';
import { createUserHandler } from './handlers/create-user.handler';
import { idValidation } from '../middlewares/user-id.validaton';
import { deleteUserHandler } from './handlers/delete-user.handler';

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
    userListHandler,
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
