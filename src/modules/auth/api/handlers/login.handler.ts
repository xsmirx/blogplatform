import { RequestHandler } from 'express';
import { LoginInputDTO, LoginOutputDTO } from '../types';
import { matchedData } from 'express-validator';
import { type AuthService } from '../../domain/auth-service';
import { ResultStatus } from '../../../../core/result/result-status';
import type { ValidationError } from '../../../../core/types/validation-error';

export const createLoginHandler = ({
  authService,
}: {
  authService: AuthService;
}): RequestHandler<
  object,
  LoginOutputDTO | { erorrMessages: ValidationError[] },
  LoginInputDTO
> => {
  return async (req, res) => {
    const body = matchedData<LoginInputDTO>(req);
    const result = await authService.login({
      loginOrEmail: body.loginOrEmail,
      password: body.password,
    });

    if (result.status !== ResultStatus.Success) {
      return res.status(401).send({
        erorrMessages: [
          { field: 'loginOrEmail', message: 'Invalid credentials' },
          { field: 'password', message: 'Invalid credentials' },
        ],
      });
    }

    res.cookie('refreshToken', result.data!.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return res.status(200).send({ accessToken: result.data!.accessToken });
  };
};
