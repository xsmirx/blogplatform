import bcrypt from 'bcrypt';

class BcryptService {
  public async generateHash(password: string) {
    return bcrypt.hash(password, 10);
  }

  public async checkPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}

export const bcryptService = new BcryptService();
