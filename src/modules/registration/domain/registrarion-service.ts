import { randomUUID } from 'crypto';
import { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';
import {
  REGISTATION_USER_ACESSOR,
  type RegistrationUserAccessor,
} from './ports/reistration-user-accessor.interface';
import {
  DomainValidationError,
  NotFoundError,
  UniqueConstraintError,
} from '../../../core/errors/domain-errors';
import { RegisterUserInput, RegistrationConfirmationInput } from './types';
import { MailAdapter } from '../../../core/adapters/email-adapter/mail-adapter';
import { emailExamples } from '../../../core/adapters/email-adapter/email-examples';
import { inject, injectable } from 'inversify';

@injectable()
export class RegistrationService {
  constructor(
    @inject(REGISTATION_USER_ACESSOR)
    protected readonly registrationUserAccessor: RegistrationUserAccessor,
    @inject(BcryptAdapter)
    protected readonly bcryptAdapter: BcryptAdapter,
    @inject(MailAdapter)
    protected readonly mailAdapter: MailAdapter,
  ) {}

  public async registerUser({
    email,
    login,
    password,
  }: RegisterUserInput): Promise<void> {
    const resultByLoginUser =
      await this.registrationUserAccessor.findByLogin(login);
    if (resultByLoginUser) {
      throw new UniqueConstraintError<Omit<RegisterUserInput, 'password'>>(
        'login',
        login,
      );
    }
    const resultByEmailUser =
      await this.registrationUserAccessor.findByEmail(email);
    if (resultByEmailUser) {
      throw new UniqueConstraintError<Omit<RegisterUserInput, 'password'>>(
        'email',
        email,
      );
    }

    const passwordHash = await this.bcryptAdapter.generateHash(password);

    const confirmationCode = randomUUID();

    await this.registrationUserAccessor.create({
      email,
      login,
      passwordHash,
      createdAt: new Date(),
      emailConfirmation: {
        confirmationCode,
        expirationDate: new Date(Date.now() + 60 * 60 * 1000),
        isConfirmed: false,
      },
    });

    this.mailAdapter
      .sendEmail(email, confirmationCode, emailExamples.registrationEmail)
      .catch((e) => console.error('error is send email:', e));
  }

  public async confirmRegistration({
    code,
  }: RegistrationConfirmationInput): Promise<void> {
    const user = await this.registrationUserAccessor.findByCode(code);
    if (!user) {
      throw new NotFoundError('user thith confirmation code not found');
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new DomainValidationError<RegistrationConfirmationInput>(
        'code',
        code,
        'code already confirmed',
      );
    }
    if (user.emailConfirmation.expirationDate < new Date()) {
      throw new DomainValidationError<RegistrationConfirmationInput>(
        'code',
        code,
        'code is expired',
      );
    }

    await this.registrationUserAccessor.updateEmailConfirmation(user.id, {
      isConfirmed: true,
    });
  }

  public async resendEmailConfirmationCode(email: string): Promise<void> {
    const user = await this.registrationUserAccessor.findByEmail(email);

    if (!user) {
      throw new NotFoundError('user with email not found');
    }
    if (user.emailConfirmation.isConfirmed) {
      throw new DomainValidationError<{ email: string }>(
        'email',
        email,
        'email is already confirmed',
      );
    }

    const newConfirmationCode = randomUUID();
    const newExpirationDate = new Date(Date.now() + 60 * 60 * 1000);

    await this.registrationUserAccessor.updateEmailConfirmation(user.id, {
      confirmationCode: newConfirmationCode,
      expirationDate: newExpirationDate,
    });

    this.mailAdapter
      .sendEmail(email, newConfirmationCode, emailExamples.registrationEmail)
      .catch((e) => console.error('error is send email:', e));
  }
}
