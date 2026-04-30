import { Filter, ObjectId, WithId } from 'mongodb';
import { DatabaseConnection } from '../../../bd/mongo.db';
import { ListResponse } from '../../../core/types/list-response';
import { UserDB } from './types';
import { UserOutputDTO, type UserListQueryInput } from '../api/types';

export class UserQueryRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().usersCollection;
  }

  private mapUserToViewModel(user: WithId<UserDB>): UserOutputDTO {
    return {
      id: user._id.toString(),
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private escapeRegex(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public async findById(userId: string): Promise<UserOutputDTO | null> {
    const user = await this.collection.findOne({ _id: new ObjectId(userId) });
    if (!user) return null;
    return this.mapUserToViewModel(user);
  }

  // public async findMeById(userId: string): Promise<MeOutputDTO> {
  //   const me = await this.collection.findOne({ _id: new ObjectId(userId) });
  //   if (!me) {
  //     throw new NotFoundError('User not found');
  //   }
  //   return {
  //     userId: me._id.toString(),
  //     login: me.login,
  //     email: me.email,
  //   };
  // }

  public async findAll(
    queries: UserListQueryInput,
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

    return {
      page: pageNumber,
      pageSize: pageSize,
      pagesCount: Math.ceil(totalCount / pageSize),
      totalCount: totalCount,
      items: users.map((user) => this.mapUserToViewModel(user)),
    };
  }
}
