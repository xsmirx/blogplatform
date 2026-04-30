import { Router } from 'express';

import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';

import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { searchLoginTermValidation } from '../middlewares/user-search-login-term.validation';
import { searchEmailTermValidation } from '../middlewares/user-search-email-term.validation';
import { pageNumberValidation } from '../middlewares/user-page-numer.validation';
import { pageSizeValidation } from '../middlewares/user-page-size.validation';
import { sortByValidation } from '../middlewares/user-sort-by.validation';
import { sortDirectionValidation } from '../middlewares/user-sort-direction.validation';
import { createUserListHandler } from './handlers/user-list.handler';
import { loginValidation } from '../middlewares/user-login.validation';
import { passwordRegistrationValidation } from '../middlewares/user-password.validation';
import { emailValidation } from '../middlewares/user-email.validation';
import {
  createCreateUserHandler,
  translateCreateUserErrors,
} from './handlers/create-user.handler';
import { idValidation } from '../middlewares/user-id.validaton';
import { createDeleteUserHandler } from './handlers/delete-user.handler';
import type { UserService } from '../domain/user-service';
import type { UserQueryRepository } from '../infrastructure/user-query-repository';

export const createUserRouter = ({
  userService,
  userQueryRepository,
}: {
  userService: UserService;
  userQueryRepository: UserQueryRepository;
}) => {
  const userRouter: Router = Router();

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
      createUserListHandler({ userQueryRepository }),
    )
    .post(
      '/',
      superAdminGuard,
      loginValidation,
      passwordRegistrationValidation,
      emailValidation,
      inputValidationResultMiddleware,
      createCreateUserHandler({ userService, userQueryRepository }),
      translateCreateUserErrors,
    )
    .delete(
      '/:id',
      superAdminGuard,
      idValidation,
      inputValidationResultMiddleware,
      createDeleteUserHandler({ userService }),
    );

  return userRouter;
};
