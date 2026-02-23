import { bcryptService } from '../../../core/adapters/bcript-service';
import { jwtService } from '../adapters/jwt-service';
import { WrongCredentialsError } from '../../../core/errors/errors';
import { User } from '../../user/domain/types';
import {
  userRepository,
  UserRepository,
} from '../../user/infrastructure/user-repository';

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  public async login({
    loginOrEmail,
    password,
  }: {
    loginOrEmail: string;
    password: string;
  }): Promise<string> {
    const user = await this.checkCredentials({
      loginOrEmail,
      password,
    });

    if (!user) {
      throw new WrongCredentialsError();
    }

    return jwtService.generateToken(user.id);
  }

  private async checkCredentials({
    loginOrEmail,
    password,
  }: {
    loginOrEmail: string;
    password: string;
  }): Promise<User | null> {
    const user = await this.userRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return null;

    return (await bcryptService.checkPassword(password, user.passwordHash))
      ? user
      : null;
  }
}

export const authService = new AuthService(userRepository);
