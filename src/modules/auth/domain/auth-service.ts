import { BcryptAdapter } from '../../../core/adapters/bcrypt-adapter';
import { JwtAdapter } from '../../../core/adapters/jwt-adapter';
import { User } from '../../user/domain/types';
import { Result } from '../../../core/result/result-type';
import { ResultStatus } from '../../../core/result/result-status';
import { randomUUID } from 'crypto';
import { MailAdapter } from '../adapters/mail-adapter';
import { emailExamples } from '../adapters/email-examples';
import type { DeviceService } from '../../security/domain/device-service';
import type { LoginInput, RefreshInput } from './types';
import { AuthUserAccessor } from './ports/user-accessor.interface';
import { UnauthorizedError } from '../../../core/errors/domain-errors';

export class AuthService {
  private readonly userRepository: AuthUserAccessor;
  private readonly deviceService: DeviceService;
  private readonly jwtAdapter: JwtAdapter;
  private readonly bcryptAdapter: BcryptAdapter;
  private readonly mailAdapter: MailAdapter;

  constructor(deps: {
    userRepository: AuthUserAccessor;
    deviceService: DeviceService;
    jwtService: JwtAdapter;
    bcryptService: BcryptAdapter;
    mailService: MailAdapter;
  }) {
    this.userRepository = deps.userRepository;
    this.deviceService = deps.deviceService;
    this.jwtAdapter = deps.jwtService;
    this.bcryptAdapter = deps.bcryptService;
    this.mailAdapter = deps.mailService;
  }

  public async login({
    loginOrEmail,
    password,
    ip,
    deviceName,
  }: LoginInput): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await this.userRepository.findByLoginOrEmail(loginOrEmail);

    if (!user) {
      throw new UnauthorizedError('Unauthorized');
    }

    const isPassCorrect = await this.bcryptAdapter.checkPassword(
      password,
      user.passwordHash,
    );

    if (!isPassCorrect) {
      throw new UnauthorizedError('Unauthorized');
    }

    const userId = user.id;
    const deviceId = randomUUID();

    const accessToken = this.jwtAdapter.generateAccessToken({
      userId,
    });
    const refreshToken = this.jwtAdapter.generateRefreshToken({
      userId,
      deviceId,
    });

    const refreshTokenPayload =
      this.jwtAdapter.verifyRefreshToken(refreshToken);

    const iat = refreshTokenPayload!.iat;
    const exp = refreshTokenPayload!.exp;

    if (iat === undefined || exp === undefined) {
      throw new Error('Invalid token paypoad');
    }

    await this.deviceService.createDevice({
      deviceId,
      userId,
      ip,
      deviceName,
      createdAt: new Date(iat * 1000),
      expiresAt: new Date(exp * 1000),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  // public async registerUser({
  //   email,
  //   login,
  //   password,
  // }: {
  //   email: string;
  //   login: string;
  //   password: string;
  // }): Promise<Result<User | null>> {
  //   const existingField = await this.userRepository.doesExistByLoginOrEmail({
  //     email,
  //     login,
  //   });

  //   if (existingField) {
  //     return {
  //       status: ResultStatus.BadRequest,
  //       data: null,
  //       extensions: [{ field: existingField, message: 'Already Registered' }],
  //     };
  //   }

  //   const passwordHash = await this.bcryptAdapter.generateHash(password);

  //   const newUser: CreateUserPayload = {
  //     email,
  //     login,
  //     passwordHash,
  //     createdAt: new Date(),
  //     emailConfirmation: {
  //       confirmationCode: randomUUID(),
  //       expirationDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  //       isConfirmed: false,
  //     },
  //   };

  //   await this.userRepository.create(newUser);

  //   this.mailAdapter
  //     .sendEmail(
  //       newUser.email,
  //       newUser.emailConfirmation.confirmationCode,
  //       emailExamples.registrationEmail,
  //     )
  //     .catch((er) => console.error('error in send email:', er));

  //   return {
  //     status: ResultStatus.Success,
  //     data: null,
  //     extensions: [],
  //   };
  // }

  // public async confirmRegistration({
  //   code,
  // }: {
  //   code: string;
  // }): Promise<Result<null>> {
  //   const user = await this.userRepository.findByConfirmationCode(code);
  //   if (!user) {
  //     return {
  //       status: ResultStatus.NotFound,
  //       data: null,
  //       extensions: [],
  //       errorMessage: 'User not found',
  //     };
  //   }

  //   if (user.emailConfirmation.isConfirmed) {
  //     return {
  //       status: ResultStatus.BadRequest,
  //       data: null,
  //       extensions: [],
  //       errorMessage: 'Email already confirmed',
  //     };
  //   }

  //   if (user.emailConfirmation.expirationDate < new Date()) {
  //     return {
  //       status: ResultStatus.BadRequest,
  //       data: null,
  //       extensions: [],
  //       errorMessage: 'Confirmation code expired',
  //     };
  //   }

  //   await this.userRepository.updateEmailConfirmation({
  //     userId: user.id,
  //     confirmationCode: user.emailConfirmation.confirmationCode,
  //     expirationDate: user.emailConfirmation.expirationDate,
  //     isConfirmed: true,
  //   });

  //   return {
  //     status: ResultStatus.Success,
  //     data: null,
  //     extensions: [],
  //   };
  // }

  // public async resendEmailConfirmationCode(
  //   email: string,
  // ): Promise<Result<null>> {
  //   const user = await this.userRepository.findByLoginOrEmail(email);
  //   if (!user) {
  //     return {
  //       status: ResultStatus.NotFound,
  //       data: null,
  //       extensions: [],
  //       errorMessage: 'User not found',
  //     };
  //   }

  //   if (user.emailConfirmation.isConfirmed) {
  //     return {
  //       status: ResultStatus.BadRequest,
  //       errorMessage: 'Email already confirmed',
  //       data: null,
  //       extensions: [],
  //     };
  //   }

  //   const newConfirmationCode = randomUUID();
  //   const newExpirationDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  //   await this.userRepository.updateEmailConfirmation({
  //     userId: user.id,
  //     confirmationCode: newConfirmationCode,
  //     expirationDate: newExpirationDate,
  //     isConfirmed: false,
  //   });

  //   this.mailAdapter
  //     .sendEmail(email, newConfirmationCode, emailExamples.registrationEmail)
  //     .catch((er) => console.error('error in send email:', er));

  //   return {
  //     status: ResultStatus.Success,
  //     data: null,
  //     extensions: [],
  //   };
  // }

  public async refresh({ deviceId, userId, ip, deviceName }: RefreshInput) {
    const accessToken = await this.jwtAdapter.generateAccessToken({ userId });
    const refreshToken = await this.jwtAdapter.generateRefreshToken({
      userId,
      deviceId,
    });
    const refreshTokenPayload =
      await this.jwtAdapter.verifyRefreshToken(refreshToken);

    const iat = refreshTokenPayload!.iat;
    const exp = refreshTokenPayload!.exp;

    await this.deviceService.updateDevice({
      deviceId,
      userId,
      expiresAt: new Date(exp * 1000),
      ip,
      deviceName,
    });
    // const payload = await this.isValidRefreshToken(refreshToken);
    // if (payload === false) {
    //   return {
    //     status: ResultStatus.Unauthorized,
    //     data: null,
    //     extensions: [],
    //     errorMessage: 'Refresh token is invalid',
    //   };
    // }
    // const user = await this.userRepository.findById(payload.userId);
    // if (!user) {
    //   return {
    //     status: ResultStatus.NotFound,
    //     data: null,
    //     extensions: [],
    //     errorMessage: 'User not found',
    //   };
    // }
    // const newAccessToken = await this.jwtService.generateAccessToken(user.id);
    // const newRefreshToken = await this.jwtService.generateRefreshToken(user.id);
    // if (payload.exp !== undefined && payload.exp * 1000 >= Date.now()) {
    //   await this.blackListRefreshTokenRepository.addToBlackList({
    //     refreshToken,
    //     expiresAt: new Date(payload.exp * 1000),
    //   });
    // }
    // return {
    //   status: ResultStatus.Success,
    //   data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    //   extensions: [],
    // };
  }

  public async logout({ deviceId }: { deviceId: string }) {
    await this.deviceService.terminateSession({ deviceId });
  }
}
