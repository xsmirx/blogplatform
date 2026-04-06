import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { type RegistrationEmailResendingInputDTO } from '../types';
import { authService } from '../../domain/auth-service';
import { ResultStatus } from '../../../../core/result/result-status';

export const registrationEmailResendHandler: RequestHandler<
  object,
  object | { errorsMessages: { message: string; field: string | null }[] },
  RegistrationEmailResendingInputDTO
> = async (req, res) => {
  const { email } = matchedData<RegistrationEmailResendingInputDTO>(req);

  const result = await authService.resendEmailConfirmationCode(email);

  if (result.status === ResultStatus.BadRequest) {
    return res.status(400).send({
      errorsMessages: [
        {
          field: 'email',
          message: 'User with this email is already confirmed',
        },
      ],
    });
  }

  if (result.status === ResultStatus.NotFound) {
    return res.status(404).send({
      errorsMessages: [
        {
          field: 'email',
          message: 'User with this email not found',
        },
      ],
    });
  }

  return res.status(204).send();
};
