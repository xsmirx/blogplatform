import { RegistrationService } from './domain/registrarion-service';
import { RegistrationUserAccessor } from './domain/ports/reistration-user-accessor.interface';
import { BcryptAdapter } from '../../core/adapters/bcrypt-adapter';
import { MailAdapter } from './adapters/mail-adapter';
import { User } from '../user/domain/types';
import {
  DomainValidationError,
  NotFoundError,
  UniqueConstraintError,
} from '../../core/errors/domain-errors';

/**
 * Integration-style tests for RegistrationService with mocked collaborators.
 *
 * These tests intentionally avoid Express and MongoDB. They verify the behaviour
 * described by the OpenAPI spec (api.json) for the registration endpoints:
 *   - POST /auth/registration                 -> 204 on success, 400 (unique login/email) on conflict
 *   - POST /auth/registration-confirmation    -> 204 on success, 400 (bad/expired/used code) otherwise
 *   - POST /auth/registration-email-resending -> 204 on success, 400 on invalid state
 *
 * The service layer signals these outcomes by resolving (=> mapped to 204) or
 * throwing domain errors (=> mapped to 400 by the API layer). We assert on that
 * contract, not on private implementation details.
 */

// Helper: build a domain User with sensible defaults, overridable per test.
const buildUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-id-1',
  login: 'testuser',
  email: 'test@example.dev',
  passwordHash: 'hashed-password',
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  emailConfirmation: {
    confirmationCode: 'confirmation-code',
    expirationDate: new Date(Date.now() + 60 * 60 * 1000),
    isConfirmed: false,
  },
  ...overrides,
});

// Flush pending microtasks so we can observe fire-and-forget side effects
// (registerUser does not await mailAdapter.sendEmail).
const flushMicrotasks = () => new Promise((resolve) => setImmediate(resolve));

describe('RegistrationService (integration with mocks)', () => {
  let userAccessor: jest.Mocked<RegistrationUserAccessor>;
  let bcryptAdapter: jest.Mocked<Pick<BcryptAdapter, 'generateHash'>>;
  let mailAdapter: jest.Mocked<Pick<MailAdapter, 'sendEmail'>>;
  let service: RegistrationService;

  beforeEach(() => {
    userAccessor = {
      findByLogin: jest.fn(),
      findByEmail: jest.fn(),
      findByCode: jest.fn(),
      create: jest.fn(),
      updateEmailConfirmation: jest.fn(),
    };

    bcryptAdapter = {
      generateHash: jest.fn().mockResolvedValue('hashed-password'),
    };

    mailAdapter = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };

    service = new RegistrationService(
      userAccessor,
      bcryptAdapter as unknown as BcryptAdapter,
      mailAdapter as unknown as MailAdapter,
    );
  });

  describe('registerUser (POST /auth/registration)', () => {
    const input = {
      login: 'testuser',
      email: 'test@example.dev',
      password: 'password123',
    };

    it('creates the user and resolves (=> 204) when login and email are free', async () => {
      userAccessor.findByLogin.mockResolvedValue(null);
      userAccessor.findByEmail.mockResolvedValue(null);
      userAccessor.create.mockResolvedValue('new-user-id');

      await expect(service.registerUser(input)).resolves.toBeUndefined();

      expect(userAccessor.create).toHaveBeenCalledTimes(1);
    });

    it('persists a hashed password, not the raw one', async () => {
      userAccessor.findByLogin.mockResolvedValue(null);
      userAccessor.findByEmail.mockResolvedValue(null);
      userAccessor.create.mockResolvedValue('new-user-id');

      await service.registerUser(input);

      expect(bcryptAdapter.generateHash).toHaveBeenCalledWith(input.password);

      const createdUser = userAccessor.create.mock.calls[0][0];
      expect(createdUser.passwordHash).toBe('hashed-password');
      expect(createdUser.passwordHash).not.toBe(input.password);
    });

    it('creates the user as not-yet-confirmed with a confirmation code and future expiration', async () => {
      userAccessor.findByLogin.mockResolvedValue(null);
      userAccessor.findByEmail.mockResolvedValue(null);
      userAccessor.create.mockResolvedValue('new-user-id');

      const before = Date.now();
      await service.registerUser(input);

      const createdUser = userAccessor.create.mock.calls[0][0];
      expect(createdUser.email).toBe(input.email);
      expect(createdUser.login).toBe(input.login);
      expect(createdUser.emailConfirmation.isConfirmed).toBe(false);
      expect(typeof createdUser.emailConfirmation.confirmationCode).toBe(
        'string',
      );
      expect(
        createdUser.emailConfirmation.confirmationCode.length,
      ).toBeGreaterThan(0);
      expect(
        createdUser.emailConfirmation.expirationDate.getTime(),
      ).toBeGreaterThan(before);
    });

    it('sends a confirmation email with the same code that was persisted', async () => {
      userAccessor.findByLogin.mockResolvedValue(null);
      userAccessor.findByEmail.mockResolvedValue(null);
      userAccessor.create.mockResolvedValue('new-user-id');

      await service.registerUser(input);
      await flushMicrotasks(); // sendEmail is fire-and-forget

      expect(mailAdapter.sendEmail).toHaveBeenCalledTimes(1);

      const [emailArg, codeArg, templateArg] =
        mailAdapter.sendEmail.mock.calls[0];
      const persistedCode =
        userAccessor.create.mock.calls[0][0].emailConfirmation.confirmationCode;

      expect(emailArg).toBe(input.email);
      expect(codeArg).toBe(persistedCode);
      expect(typeof templateArg).toBe('function');
    });

    it('throws UniqueConstraintError(login) when login already exists (=> 400)', async () => {
      userAccessor.findByLogin.mockResolvedValue(buildUser());

      await expect(service.registerUser(input)).rejects.toBeInstanceOf(
        UniqueConstraintError,
      );

      await expect(service.registerUser(input)).rejects.toMatchObject({
        paramKey: 'login',
      });

      expect(userAccessor.create).not.toHaveBeenCalled();
      expect(mailAdapter.sendEmail).not.toHaveBeenCalled();
    });

    it('throws UniqueConstraintError(email) when email already exists (=> 400)', async () => {
      userAccessor.findByLogin.mockResolvedValue(null);
      userAccessor.findByEmail.mockResolvedValue(buildUser());

      await expect(service.registerUser(input)).rejects.toMatchObject({
        paramKey: 'email',
      });

      expect(userAccessor.create).not.toHaveBeenCalled();
      expect(mailAdapter.sendEmail).not.toHaveBeenCalled();
    });

    it('reports the login conflict first when both login and email are taken', async () => {
      userAccessor.findByLogin.mockResolvedValue(buildUser());
      userAccessor.findByEmail.mockResolvedValue(buildUser());

      await expect(service.registerUser(input)).rejects.toMatchObject({
        paramKey: 'login',
      });
    });
  });

  describe('confirmRegistration (POST /auth/registration-confirmation)', () => {
    it('confirms the account and resolves (=> 204) for a valid, unconfirmed, non-expired code', async () => {
      const user = buildUser();
      userAccessor.findByCode.mockResolvedValue(user);
      userAccessor.updateEmailConfirmation.mockResolvedValue(true);

      await expect(
        service.confirmRegistration({ code: 'valid-code' }),
      ).resolves.toBeUndefined();

      expect(userAccessor.updateEmailConfirmation).toHaveBeenCalledWith(
        user.id,
        { isConfirmed: true },
      );
    });

    it('throws NotFoundError when the code does not match any user (=> 400)', async () => {
      userAccessor.findByCode.mockResolvedValue(null);

      await expect(
        service.confirmRegistration({ code: 'missing-code' }),
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(userAccessor.updateEmailConfirmation).not.toHaveBeenCalled();
    });

    it('throws DomainValidationError when the code is already confirmed (=> 400)', async () => {
      const user = buildUser({
        emailConfirmation: {
          confirmationCode: 'confirmation-code',
          expirationDate: new Date(Date.now() + 60 * 60 * 1000),
          isConfirmed: true,
        },
      });
      userAccessor.findByCode.mockResolvedValue(user);

      await expect(
        service.confirmRegistration({ code: 'confirmation-code' }),
      ).rejects.toBeInstanceOf(DomainValidationError);

      expect(userAccessor.updateEmailConfirmation).not.toHaveBeenCalled();
    });

    it('throws DomainValidationError when the code is expired (=> 400)', async () => {
      const user = buildUser({
        emailConfirmation: {
          confirmationCode: 'confirmation-code',
          expirationDate: new Date(Date.now() - 1000),
          isConfirmed: false,
        },
      });
      userAccessor.findByCode.mockResolvedValue(user);

      await expect(
        service.confirmRegistration({ code: 'confirmation-code' }),
      ).rejects.toBeInstanceOf(DomainValidationError);

      expect(userAccessor.updateEmailConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('resendEmailConfirmationCode (POST /auth/registration-email-resending)', () => {
    const email = 'test@example.dev';

    it('generates a fresh code, persists it and re-sends the email (=> 204)', async () => {
      const user = buildUser();
      userAccessor.findByEmail.mockResolvedValue(user);
      userAccessor.updateEmailConfirmation.mockResolvedValue(true);

      await expect(
        service.resendEmailConfirmationCode(email),
      ).resolves.toBeUndefined();

      expect(userAccessor.updateEmailConfirmation).toHaveBeenCalledTimes(1);
      const [userId, confirmation] =
        userAccessor.updateEmailConfirmation.mock.calls[0];
      expect(userId).toBe(user.id);
      expect(typeof confirmation.confirmationCode).toBe('string');
      expect(confirmation.expirationDate).toBeInstanceOf(Date);

      expect(mailAdapter.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('sends the newly generated code (not the old one) to the same email', async () => {
      const user = buildUser();
      userAccessor.findByEmail.mockResolvedValue(user);
      userAccessor.updateEmailConfirmation.mockResolvedValue(true);

      await service.resendEmailConfirmationCode(email);

      const persistedCode =
        userAccessor.updateEmailConfirmation.mock.calls[0][1].confirmationCode;
      const [emailArg, codeArg] = mailAdapter.sendEmail.mock.calls[0];

      expect(emailArg).toBe(email);
      expect(codeArg).toBe(persistedCode);
      expect(codeArg).not.toBe(user.emailConfirmation.confirmationCode);
    });

    it('throws NotFoundError when no user has that email (=> 400)', async () => {
      userAccessor.findByEmail.mockResolvedValue(null);

      await expect(
        service.resendEmailConfirmationCode(email),
      ).rejects.toBeInstanceOf(NotFoundError);

      expect(userAccessor.updateEmailConfirmation).not.toHaveBeenCalled();
      expect(mailAdapter.sendEmail).not.toHaveBeenCalled();
    });

    it('throws DomainValidationError when the email is already confirmed (=> 400)', async () => {
      const user = buildUser({
        emailConfirmation: {
          confirmationCode: 'confirmation-code',
          expirationDate: new Date(Date.now() + 60 * 60 * 1000),
          isConfirmed: true,
        },
      });
      userAccessor.findByEmail.mockResolvedValue(user);

      await expect(
        service.resendEmailConfirmationCode(email),
      ).rejects.toBeInstanceOf(DomainValidationError);

      expect(userAccessor.updateEmailConfirmation).not.toHaveBeenCalled();
      expect(mailAdapter.sendEmail).not.toHaveBeenCalled();
    });
  });
});
