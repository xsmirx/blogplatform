import { RequestHandler } from 'express';
import { LoginInputDTO, LoginOutputDTO } from '../types';
import { matchedData } from 'express-validator';
import { authService } from '../../domain/auth-service';
import { ResultStatus } from '../../../../core/result/result-status';
import type { ValidationError } from '../../../../core/types/validation-error';

export const loginHandler: RequestHandler<
  object,
  LoginOutputDTO | { erorrMessages: ValidationError[] },
  LoginInputDTO
> = async (req, res) => {
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

  return res.status(200).send({ accessToken: result.data! });
};
