import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { type RegistrationEmailResendingInputDTO } from '../types';
import { RegistrationService } from '../../../registration/domain/registrarion-service';
import { ValidationError } from '../../../../core/errors/api-errors';
import {
  DomainValidationError,
  NotFoundError,
} from '../../../../core/errors/domain-errors';

export const createRegistrationEmailResendHandler = ({
  registrationService,
}: {
  registrationService: RegistrationService;
}): RequestHandler<
  object,
  object | { errorsMessages: { message: string; field: string | null }[] },
  RegistrationEmailResendingInputDTO
> => {
  return async (req, res) => {
    const { email } = matchedData<RegistrationEmailResendingInputDTO>(req);

    try {
      await registrationService.resendEmailConfirmationCode(email);
    } catch (e) {
      if (e instanceof NotFoundError) {
        return res.status(204).send();
      }
      if (e instanceof DomainValidationError) {
        throw new ValidationError([{ field: 'email', message: e.message }]);
      }
      throw e;
    }

    return res.status(204).send();
  };
};
