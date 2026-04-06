import { bcryptService } from '../../../core/adapters/bcript-service';
import { jwtService } from '../adapters/jwt-service';
import { User } from '../../user/domain/types';
import {
  userRepository,
  UserRepository,
} from '../../user/infrastructure/user-repository';
import { Result } from '../../../core/result/result-type';
import { ResultStatus } from '../../../core/result/result-status';

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
}

export const authService = new AuthService(userRepository);
