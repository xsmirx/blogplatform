import { Filter, ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd';
import { UserDB, UserListPagQueryInput, UserOutputDTO } from './types';
import { NotFoundError } from '../../core/errors/errors';
import { ListResponse } from '../../core/types/list-response';
import { MeOutputDTO } from '../auth/types';

class UserQueryRepository {
  private escapeRegex(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public get collection() {
    return databaseConnection.getDb().collection<UserDB>('users');
  }

  public async findAll(
    queries: UserListPagQueryInput,
  ): Promise<ListResponse<UserOutputDTO>> {
    const {
      searchLoginTerm,
      searchEmailTerm,
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
    } = queries;

    const filter: Filter<UserDB> =
      searchLoginTerm || searchEmailTerm ? { $or: [] } : {};

    if (searchLoginTerm) {
      filter.$or?.push({
        login: {
          $regex: this.escapeRegex(searchLoginTerm),
          $options: 'i',
        },
      });
    }
    if (searchEmailTerm) {
      filter.$or?.push({
        email: {
          $regex: this.escapeRegex(searchEmailTerm),
          $options: 'i',
        },
      });
    }

    const users = await this.collection
      .find(filter)
      .sort(sortBy, sortDirection)
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    const totalCount = await this.collection.countDocuments(filter);

    return this.mapUserListToListResponseViewModel({
      totalCount: totalCount,
      items: users,
      queries,
    });
  }

  public async findUserById(userId: string): Promise<UserOutputDTO> {
    const user = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.mapUserToViewModel(user);
  }

  public async findMeById(userId: string): Promise<MeOutputDTO> {
    const me = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!me) {
      throw new NotFoundError('User not found');
    }
    return {
      userId: me._id.toString(),
      login: me.login,
      email: me.email,
    };
  }

  private mapUserToViewModel(user: WithId<UserDB>): UserOutputDTO {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user._id.getTimestamp().toISOString(),
    };
  }

  private mapUserListToListResponseViewModel({
    items,
    queries,
    totalCount,
  }: {
    items: WithId<UserDB>[];
    queries: UserListPagQueryInput;
    totalCount: number;
  }): ListResponse<UserOutputDTO> {
    return {
      page: queries.pageNumber,
      pageSize: queries.pageSize,
      pagesCount: Math.ceil(totalCount / queries.pageSize),
      totalCount: totalCount,
      items: items.map(this.mapUserToViewModel),
    };
  }
}

export const userQueryRepository = new UserQueryRepository();
