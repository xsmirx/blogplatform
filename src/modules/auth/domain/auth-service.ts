import { BcryptService } from '../../../core/adapters/bcript-service';
import { JwtService } from '../adapters/jwt-service';
import { User } from '../../user/domain/types';
import { UserRepository } from '../../user/infrastructure/user-repository';
import { Result } from '../../../core/result/result-type';
import { ResultStatus } from '../../../core/result/result-status';
import type { CreateUserPayload } from '../../user/infrastructure/types';
import { randomUUID } from 'crypto';
import { MailService } from '../adapters/mail-service';
import { emailExamples } from '../adapters/email-examples';
import type { DeviceService } from '../../security/domain/device-service';
import type { LoginInput, RefreshInput } from './types';

export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly deviceService: DeviceService;
  private readonly jwtService: JwtService;
  private readonly bcryptService: BcryptService;
  private readonly mailService: MailService;

  constructor(deps: {
    userRepository: UserRepository;
    deviceService: DeviceService;
    jwtService: JwtService;
    bcryptService: BcryptService;
    mailService: MailService;
  }) {
    this.userRepository = deps.userRepository;
    this.deviceService = deps.deviceService;
    this.jwtService = deps.jwtService;
    this.bcryptService = deps.bcryptService;
    this.mailService = deps.mailService;
  }

  public async login({
    loginOrEmail,
    password,
    ip,
    deviceName,
  }: LoginInput): Promise<
    Result<{ accessToken: string; refreshToken: string } | null>
  > {
    const result = await this.checkCredentials({
      loginOrEmail,
      password,
    });

    if (result.status !== ResultStatus.Success) {
      return {
        status: ResultStatus.Unauthorized,
        data: null,
        extensions: [],
      };
    }

    const userId = result.data!.id;
    const deviceId = randomUUID();

    const accessToken = await this.jwtService.generateAccessToken({
      userId,
    });
    const refreshToken = await this.jwtService.generateRefreshToken({
      userId,
      deviceId,
    });

    const refreshTokenPayload =
      await this.jwtService.verifyRefreshToken(refreshToken);

    const iat = refreshTokenPayload!.iat;
    const exp = refreshTokenPayload!.exp;

    if (iat === undefined || exp === undefined) {
      return {
        status: ResultStatus.Unauthorized,
        data: null,
        extensions: [],
        errorMessage: 'Invalid token payload',
      };
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
      status: ResultStatus.Success,
      data: { accessToken, refreshToken },
      extensions: [],
    };
  }

  private async checkCredentials({
    loginOrEmail,
    password,
  }: {
    loginOrEmail: string;
    password: string;
  }): Promise<Result<User | null>> {
    const user = await this.userRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) {
      return {
        status: ResultStatus.NotFound,
        data: null,
        extensions: [],
        errorMessage: 'User not found',
      };
    }

    const isPassCorrect = await this.bcryptService.checkPassword(
      password,
      user.passwordHash,
    );

    if (!isPassCorrect) {
      return {
        status: ResultStatus.BadRequest,
        data: null,
        extensions: [],
        errorMessage: 'Bad request',
      };
    }

    return {
      status: ResultStatus.Success,
      data: user,
      extensions: [],
    };
  }

  public async registerUser({
    email,
    login,
    password,
  }: {
    email: string;
    login: string;
    password: string;
  }): Promise<Result<User | null>> {
    const existingField = await this.userRepository.doesExistByLoginOrEmail({
      email,
      login,
    });

    if (existingField) {
      return {
        status: ResultStatus.BadRequest,
        data: null,
        extensions: [{ field: existingField, message: 'Already Registered' }],
      };
    }

    const passwordHash = await this.bcryptService.generateHash(password);

    const newUser: CreateUserPayload = {
      email,
      login,
      passwordHash,
      createdAt: new Date(),
      emailConfirmation: {
        confirmationCode: randomUUID(),
        expirationDate: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        isConfirmed: false,
      },
    };

    await this.userRepository.create(newUser);

    this.mailService
      .sendEmail(
        newUser.email,
        newUser.emailConfirmation.confirmationCode,
        emailExamples.registrationEmail,
      )
      .catch((er) => console.error('error in send email:', er));

    return {
      status: ResultStatus.Success,
      data: null,
      extensions: [],
    };
  }

  public async confirmRegistration({
    code,
  }: {
    code: string;
  }): Promise<Result<null>> {
    const user = await this.userRepository.findByConfirmationCode(code);
    if (!user) {
      return {
        status: ResultStatus.NotFound,
        data: null,
        extensions: [],
        errorMessage: 'User not found',
      };
    }

    if (user.emailConfirmation.isConfirmed) {
      return {
        status: ResultStatus.BadRequest,
        data: null,
        extensions: [],
        errorMessage: 'Email already confirmed',
      };
    }

    if (user.emailConfirmation.expirationDate < new Date()) {
      return {
        status: ResultStatus.BadRequest,
        data: null,
        extensions: [],
        errorMessage: 'Confirmation code expired',
      };
    }

    await this.userRepository.updateEmailConfirmation({
      userId: user.id,
      confirmationCode: user.emailConfirmation.confirmationCode,
      expirationDate: user.emailConfirmation.expirationDate,
      isConfirmed: true,
    });

    return {
      status: ResultStatus.Success,
      data: null,
      extensions: [],
    };
  }

  public async resendEmailConfirmationCode(
    email: string,
  ): Promise<Result<null>> {
    const user = await this.userRepository.findByLoginOrEmail(email);
    if (!user) {
      return {
        status: ResultStatus.NotFound,
        data: null,
        extensions: [],
        errorMessage: 'User not found',
      };
    }

    if (user.emailConfirmation.isConfirmed) {
      return {
        status: ResultStatus.BadRequest,
        errorMessage: 'Email already confirmed',
        data: null,
        extensions: [],
      };
    }

    const newConfirmationCode = randomUUID();
    const newExpirationDate = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.updateEmailConfirmation({
      userId: user.id,
      confirmationCode: newConfirmationCode,
      expirationDate: newExpirationDate,
      isConfirmed: false,
    });

    this.mailService
      .sendEmail(email, newConfirmationCode, emailExamples.registrationEmail)
      .catch((er) => console.error('error in send email:', er));

    return {
      status: ResultStatus.Success,
      data: null,
      extensions: [],
    };
  }

  public async refresh({ deviceId, userId, ip, deviceName }: RefreshInput) {
    const accessToken = await this.jwtService.generateAccessToken({ userId });
    const refreshToken = await this.jwtService.generateRefreshToken({
      userId,
      deviceId,
    });
    const refreshTokenPayload =
      await this.jwtService.verifyRefreshToken(refreshToken);

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

  public async logout({ refreshToken }: { refreshToken: string }) {
    // const payload = await this.isValidRefreshToken(refreshToken);
    // if (payload === false) {
    //   return {
    //     status: ResultStatus.Unauthorized,
    //     data: null,
    //     extensions: [],
    //     errorMessage: 'Refresh token is invalid',
    //   };
    // }
    // if (payload.exp !== undefined && payload.exp * 1000 >= Date.now()) {
    //   await this.blackListRefreshTokenRepository.addToBlackList({
    //     refreshToken,
    //     expiresAt: new Date(payload.exp * 1000),
    //   });
    // }
    // return {
    //   status: ResultStatus.Success,
    //   data: null,
    //   extensions: [],
    // };
  }
}
