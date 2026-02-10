import { bcryptService } from '../../core/adapters/bcript-service';
import { jwtService } from '../../core/adapters/jwt-service';
import { WrongCredentialsError } from '../../core/errors/errors';
import { User } from '../user/types';
import { userRepository } from '../user/user-repository';

class AuthService {
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
    const user = await userRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return null;

    return (await bcryptService.checkPassword(password, user.saltedHash))
      ? {
          id: user.id,
          login: user.login,
          email: user.email,
          createdAt: user.createdAt,
        }
      : null;
  }
}

export const authService = new AuthService();
