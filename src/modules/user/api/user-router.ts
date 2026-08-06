import { Router } from 'express';
import { superAdminGuard } from '../../auth/api/guards/super-admin-guard';
import { inputValidationResultMiddleware } from '../../../core/middleware/input-validation-result.middleware';
import { searchLoginTermValidation } from '../middlewares/user-search-login-term.validation';
import { searchEmailTermValidation } from '../middlewares/user-search-email-term.validation';
import { pageNumberValidation } from '../middlewares/user-page-numer.validation';
import { pageSizeValidation } from '../middlewares/user-page-size.validation';
import { sortByValidation } from '../middlewares/user-sort-by.validation';
import { sortDirectionValidation } from '../middlewares/user-sort-direction.validation';
import { loginValidation } from '../middlewares/user-login.validation';
import { passwordRegistrationValidation } from '../middlewares/user-password.validation';
import { emailValidation } from '../middlewares/user-email.validation';
import { idValidation } from '../middlewares/user-id.validaton';
import { Container } from 'inversify';
import { UserContoller } from './user-controller';

export const createUserRouter = (container: Container) => {
  const userController = container.get(UserContoller);
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
      userController.getUserList,
    )
    .post(
      '/',
      superAdminGuard,
      loginValidation,
      passwordRegistrationValidation,
      emailValidation,
      inputValidationResultMiddleware,
      userController.createUser,
    )
    .delete(
      '/:id',
      superAdminGuard,
      idValidation,
      inputValidationResultMiddleware,
      userController.deleteUser,
    );

  return userRouter;
};
