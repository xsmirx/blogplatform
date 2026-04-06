import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { RegistrationInputDTO } from '../types';
import { ResultStatus } from '../../../../core/result/result-status';
import type { AuthService } from '../../domain/auth-service';

export const createRegistrationHandler = ({
  authService,
}: {
  authService: AuthService;
}): RequestHandler<
  object,
  object | { errorsMessages: { message: string; field: string | null }[] },
  RegistrationInputDTO
> => {
  return async (req, res) => {
    const { email, login, password } = matchedData<RegistrationInputDTO>(req);

    const result = await authService.registerUser({ email, login, password });

    if (result.status === ResultStatus.BadRequest) {
      return res.status(400).send({
        errorsMessages: result.extensions.map((e) => ({
          message: e.message,
          field: e.field,
        })),
      });
    }

    return res.status(204).send();
  };
};
