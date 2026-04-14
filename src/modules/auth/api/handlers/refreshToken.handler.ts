import type { RequestHandler } from 'express';
import type { AuthService } from '../../domain/auth-service';
import type { LoginOutputDTO } from '../types';
import { ResultStatus } from '../../../../core/result/result-status';

export const createRefreshTokenHandler = ({
  authService,
}: {
  authService: AuthService;
}): RequestHandler<object, LoginOutputDTO> => {
  return async (req, res) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;
    if (!refreshToken) {
      return res.sendStatus(401);
    }
    const result = await authService.refreshToken({ refreshToken });

    if (result.status !== ResultStatus.Success) {
      return res.sendStatus(401);
    }

    res.cookie('refreshToken', result.data!.refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return res.status(200).send({ accessToken: result.data!.accessToken });
  };
};
