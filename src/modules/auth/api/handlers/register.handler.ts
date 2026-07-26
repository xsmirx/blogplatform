import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import { RegistrationInputDTO } from '../types';
import { RegistrationService } from '../../../registration/domain/registrarion-service';
import { UniqueConstraintError } from '../../../../core/errors/domain-errors';
import { ValidationError } from '../../../../core/errors/api-errors';

export const createRegistrationHandler = ({
  registrationService,
}: {
  registrationService: RegistrationService;
}): RequestHandler<object, object, RegistrationInputDTO> => {
  return async (req, res) => {
    const { email, login, password } = matchedData<RegistrationInputDTO>(req);

    try {
      await registrationService.registerUser({ email, login, password });
    } catch (e) {
      if (e instanceof UniqueConstraintError) {
        if (e.paramKey === 'login') {
          throw new ValidationError([
            { field: 'login', message: 'login already exist' },
          ]);
        }
        if (e.paramKey === 'email') {
          throw new ValidationError([
            { field: 'email', message: 'email already exist' },
          ]);
        }
      } else {
        throw e;
      }
    }

    return res.status(204).send();
  };
};
