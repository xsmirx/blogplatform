import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { type RegistrationConfirmationInputDTO } from '../types';
import { authService } from '../../domain/auth-service';
import { ResultStatus } from '../../../../core/result/result-status';

export const registrationConfirmationHandler: RequestHandler<
  object,
  object | { errorsMessages: { message: string; field: string | null }[] },
  RegistrationConfirmationInputDTO
> = async (req, res) => {
  const { code } = matchedData<RegistrationConfirmationInputDTO>(req);

  const result = await authService.confirmRegistration({ code });

  if (result.status === ResultStatus.NotFound) {
    return res.status(400).send({
      errorsMessages: [{ message: 'Bad confirmation code', field: 'code' }],
    });
  }

  if (result.status === ResultStatus.BadRequest) {
    return res.status(400).send({
      errorsMessages: [
        { message: result.errorMessage || 'Bad request', field: 'code' },
      ],
    });
  }

  return res.status(204).send();
};
