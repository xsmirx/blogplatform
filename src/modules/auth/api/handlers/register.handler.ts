import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { RegistrationInputDTO } from '../types';
import { authService } from '../../domain/auth-service';
import { ResultStatus } from '../../../../core/result/result-status';

export const registrationHandler: RequestHandler<
  object,
  object | { errorsMessages: { message: string; field: string | null }[] },
  RegistrationInputDTO
> = async (req, res) => {
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
