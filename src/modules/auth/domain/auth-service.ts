import { bcryptService } from '../../../core/adapters/bcript-service';
import { jwtService } from '../adapters/jwt-service';
import { User } from '../../user/domain/types';
import {
  userRepository,
  UserRepository,
} from '../../user/infrastructure/user-repository';
import { Result } from '../../../core/result/result-type';
import { ResultStatus } from '../../../core/result/result-status';
import type { CreateUserPayload } from '../../user/infrastructure/types';
import { randomUUID } from 'crypto';
import { mailService } from '../adapters/mail-service';
import { emailExamples } from '../adapters/email-examples';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  public async login({
    loginOrEmail,
    password,
  }: {
    loginOrEmail: string;
    password: string;
  }): Promise<Result<string | null>> {
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

    const token = await jwtService.generateToken(result.data!.id);

    return {
      status: ResultStatus.Success,
      data: token,
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

    const isPassCorrect = await bcryptService.checkPassword(
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

    const passwordHash = await bcryptService.generateHash(password);

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

    mailService
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
}

export const authService = new AuthService(userRepository);
