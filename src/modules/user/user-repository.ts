import { ObjectId } from 'mongodb';
import { databaseConnection } from '../../bd';
import { User, UserDB } from './types';
import { EmailNotUniqueError, LoginNotUniqueError } from './user-errors';
import { NotFoundError } from '../../core/errors/errors';

class UserRepository {
  public get collection() {
    return databaseConnection.getDb().collection<UserDB>('users');
  }

  public async findById(userId: string): Promise<User> {
    const user = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public async findByLoginOrEmail(
    loginOrEmail: string,
  ): Promise<(User & { saltedHash: string }) | null> {
    const user = await this.collection.findOne({
      $or: [{ email: loginOrEmail.toLowerCase() }, { login: loginOrEmail }],
    });
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      saltedHash: user.saltedHash,
      createdAt: user.createdAt.toISOString(),
    };
  }

  public async checkUserExists({
    email,
    login,
  }: {
    email: string;
    login: string;
  }): Promise<void> {
    const userByEmail = await this.collection.findOne({
      email: email,
    });
    if (userByEmail) {
      throw new EmailNotUniqueError(
        'User with given email or login already exists',
      );
    }
    const userByLogin = await this.collection.findOne({ login });
    if (userByLogin) {
      throw new LoginNotUniqueError(
        'User with given email or login already exists',
      );
    }
  }

  public async create(user: {
    login: string;
    email: string;
    saltedHash: string;
  }) {
    const result = await this.collection.insertOne({
      login: user.login,
      email: user.email,
      saltedHash: user.saltedHash,
      createdAt: new Date(),
    });
    return result.insertedId.toString();
  }

  public async delete(userId: string): Promise<void> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(userId),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError('User not found');
    }
  }
}

export const userRepository = new UserRepository();
