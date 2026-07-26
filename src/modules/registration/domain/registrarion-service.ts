import { randomUUID } from 'crypto';
import { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';
import { RegistrationUserAccessor } from './ports/reistration-user-accessor.interface';
import { UniqueConstraintError } from '../../../core/errors/domain-errors';
import { RegisterUserInput } from './types';
import { MailAdapter } from '../adapters/mail-adapter';
import { emailExamples } from '../adapters/email-examples';

export class RegistrationService {
  private readonly registrationUserAccessor: RegistrationUserAccessor;
  private readonly bcriptAdapter: BcryptAdapter;
  private readonly mailAdapter: MailAdapter;

  constructor(deps: {
    userAccessor: RegistrationUserAccessor;
    bcriptAdapter: BcryptAdapter;
    mailAdapter: MailAdapter;
  }) {
    this.registrationUserAccessor = deps.userAccessor;
    this.bcriptAdapter = deps.bcriptAdapter;
    this.mailAdapter = deps.mailAdapter;
  }

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

    const passwordHash = await this.bcriptAdapter.generateHash(password);

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

  public async confirmRegistration() {}

  public async resendEmailConfirmationCode() {}
}
