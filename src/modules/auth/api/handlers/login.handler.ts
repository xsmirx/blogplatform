import { RequestHandler } from 'express';
import { LoginInputDTO, LoginOutputDTO } from '../types';
import { matchedData } from 'express-validator';
import { type AuthService } from '../../domain/auth-service';
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
    const ip = req.ip as string;
    const deviceName = req.headers['user-agent'] || 'unidentified device';

    const result = await authService.login({
      loginOrEmail: body.loginOrEmail,
      password: body.password,
      ip,
      deviceName,
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return res.status(200).send({ accessToken: result.accessToken });
  };
};
