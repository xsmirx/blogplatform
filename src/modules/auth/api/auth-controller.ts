import { RequestHandler } from 'express';
import { inject, injectable } from 'inversify';
import {
  LoginInputDTO,
  LoginOutputDTO,
  NewPasswordInputDTO,
  RecoveryPasswordInputDTO,
  RegistrationConfirmationInputDTO,
  RegistrationEmailResendingInputDTO,
  RegistrationInputDTO,
} from './types';
import { matchedData } from 'express-validator';
import { AuthService } from '../domain/auth-service';
import { MeOutputDTO } from '../../user/api/types';
import {
  DomainValidationError,
  NotFoundError,
  UnauthorizedError,
  UniqueConstraintError,
} from '../../../core/errors/domain-errors';
import { UserQueryRepository } from '../../user/infrastructure/user-query-repository';
import { ValidationError } from '../../../core/errors/api-errors';
import { RegistrationService } from '../../registration/domain/registrarion-service';
import { RecoveryService } from '../../recovery/domain/recovery-service';

@injectable()
export class AuthController {
  constructor(
    @inject(AuthService) protected readonly authService: AuthService,
    @inject(RegistrationService)
    protected readonly registrationService: RegistrationService,
    @inject(RecoveryService)
    protected readonly recoveryService: RecoveryService,
    @inject(UserQueryRepository)
    protected readonly userQueryRepository: UserQueryRepository,
  ) {}

  public login: RequestHandler<object, LoginOutputDTO, LoginInputDTO> = async (
    req,
    res,
  ) => {
    const body = matchedData<LoginInputDTO>(req);
    const ip = req.ip as string;
    const deviceName = req.headers['user-agent'] || 'unidentified device';

    const result = await this.authService.login({
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

  public logout: RequestHandler = async (req, res) => {
    const deviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;

    await this.authService.logout({ deviceId, version });

    res.clearCookie('refreshToken', { httpOnly: true, secure: true });
    return res.sendStatus(204);
  };

  public me: RequestHandler<object, MeOutputDTO> = async (req, res) => {
    const userId = req.appContext?.user?.userId as string;

    const user = await this.userQueryRepository.findMeById(userId);

    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    return res.status(200).send(user);
  };

  public refreshToken: RequestHandler<object, LoginOutputDTO> = async (
    req,
    res,
  ) => {
    const userId = req.appContext?.user?.userId as string;
    const deviceId = req.appContext?.device?.deviceId as string;
    const version = req.appContext?.device?.version as string;
    const ip = req.ip as string;
    const deviceName = req.headers['user-agent'] || 'unidentified device';

    const { accessToken, refreshToken } = await this.authService.refresh({
      deviceId,
      version,
      userId,
      ip,
      deviceName,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
    });

    return res.status(200).send({ accessToken: accessToken });
  };

  public registration: RequestHandler<object, object, RegistrationInputDTO> =
    async (req, res) => {
      const { email, login, password } = matchedData<RegistrationInputDTO>(req);

      try {
        await this.registrationService.registerUser({ email, login, password });
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

  public confirmRegistration: RequestHandler<
    object,
    object,
    RegistrationConfirmationInputDTO
  > = async (req, res) => {
    const { code } = matchedData<RegistrationConfirmationInputDTO>(req);

    try {
      await this.registrationService.confirmRegistration({ code });
    } catch (e) {
      if (e instanceof NotFoundError) {
        throw new ValidationError([{ field: 'code', message: e.message }]);
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

  public resendRegistrationEmail: RequestHandler<
    object,
    object,
    RegistrationEmailResendingInputDTO
  > = async (req, res) => {
    const { email } = matchedData<RegistrationEmailResendingInputDTO>(req);

    try {
      await this.registrationService.resendEmailConfirmationCode(email);
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

  public recoveryPassword: RequestHandler<
    object,
    object,
    RecoveryPasswordInputDTO
  > = async (req, res) => {
    const { email } = matchedData<RecoveryPasswordInputDTO>(req);

    await this.recoveryService.recoveryPassword(email);

    return res.status(204).send();
  };

  public updatePassword: RequestHandler<object, object, NewPasswordInputDTO> =
    async (req, res) => {
      const { newPassword, recoveryCode } =
        matchedData<NewPasswordInputDTO>(req);

      try {
        await this.recoveryService.updatePassword(recoveryCode, newPassword);
        return res.status(204).send();
      } catch (e) {
        if (e instanceof DomainValidationError) {
          throw new ValidationError([]);
        }
        throw e;
      }
    };
}
