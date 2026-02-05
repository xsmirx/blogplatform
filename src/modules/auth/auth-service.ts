import { WrongCredentialsError } from '../../core/errors/errors';
import { userRepository } from '../user/user-repository';

import bcrypt from 'bcrypt';

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
  }): Promise<boolean> {
    const user = await userRepository.findByLoginOrEmail(loginOrEmail);
    if (!user) return false;

    return await bcrypt.compare(password, user.saltedHash);
  }
}

export const authService = new AuthService();
