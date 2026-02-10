import { bcryptService } from '../../core/adapters/bcript-service';
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
  }) {
    const isCredentialsValid = await this.checkCredentials({
      loginOrEmail,
      password,
    });

    if (!isCredentialsValid) {
      throw new WrongCredentialsError();
    }

    return true;
  }

  private async checkCredentials({
    loginOrEmail,
    password,
  }: {
    loginOrEmail: string;
    password: string;
  }): Promise<User | boolean> {
    const user = await userRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return false;

    return (await bcryptService.checkPassword(password, user.saltedHash))
      ? {
          id: user.id,
          login: user.login,
          email: user.email,
          createdAt: user.createdAt,
        }
      : false;
  }
}

export const authService = new AuthService();
