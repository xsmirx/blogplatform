import { ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd';
import { UserDB, UserOutputDTO } from './types';
import { NotFoundError } from '../../core/errors/errors';

class UserQueryRepository {
  public get collection() {
    return databaseConnection.getDb().collection<UserDB>('users');
  }

  public async findUserById(userId: string): Promise<UserOutputDTO> {
    const user = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.mapUserToViewModel(user);
  }

  private mapUserToViewModel(user: WithId<UserDB>): UserOutputDTO {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user._id.getTimestamp().toISOString(),
    };
  }
}

export const userQueryRepository = new UserQueryRepository();
