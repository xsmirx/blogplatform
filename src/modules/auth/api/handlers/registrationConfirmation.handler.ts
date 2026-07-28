import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { type RegistrationConfirmationInputDTO } from '../types';
import { RegistrationService } from '../../../registration/domain/registrarion-service';
import {
  DomainValidationError,
  NotFoundError,
} from '../../../../core/errors/domain-errors';
import { ValidationError } from '../../../../core/errors/api-errors';

export const createRegistrationConfirmationHandler = ({
  registrationService,
}: {
  registrationService: RegistrationService;
}): RequestHandler<
  object,
  object | { errorsMessages: { message: string; field: string | null }[] },
  RegistrationConfirmationInputDTO
> => {
  return async (req, res) => {
    const { code } = matchedData<RegistrationConfirmationInputDTO>(req);

    try {
      await registrationService.confirmRegistration({ code });
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new ValidationError([{ field: code, message: e.message }]);
      }
      if (e instanceof DomainValidationError) {
        throw new ValidationError([
          { field: e.paramKey as string, message: e.message },
        ]);
      }
      throw e;
    }

    return res.status(204).send();
  };
};
