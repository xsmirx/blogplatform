import { ListResponse } from '../../../core/types/list-response';
import { UserDocument, UserInput } from './types';
import {
  MeOutputDTO,
  UserOutputDTO,
  type UserListQueryInput,
} from '../api/types';
import { inject, injectable } from 'inversify';
import { USER_MODEL } from './user-model';
import { Model } from 'mongoose';

@injectable()
export class UserQueryRepository {
  constructor(
    @inject(USER_MODEL)
    protected readonly userModel: Model<UserInput>,
  ) {}

  private mapUserToViewModel(user: UserDocument): UserOutputDTO {
    return {
      id: user.id,
      login: user.login,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }

  private escapeRegex(text: string) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  public async findById(userId: string): Promise<UserOutputDTO | null> {
    const user = await this.userModel.findById(userId);
    if (!user) return null;
    return this.mapUserToViewModel(user);
  }

  public async findMeById(userId: string): Promise<MeOutputDTO | null> {
    const me = await this.userModel.findById(userId);
    if (!me) {
      return null;
    }
    return {
      userId: me._id.toString(),
      login: me.login,
      email: me.email,
    };
  }

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

    const query = this.userModel.find();

    if (searchLoginTerm) {
      query.or([
        this.userModel
          .where('login')
          .regex(new RegExp(this.escapeRegex(searchLoginTerm), 'i'))
          .getFilter(),
      ]);
    }
    if (searchEmailTerm) {
      query.or([
        this.userModel
          .where('email')
          .regex(new RegExp(this.escapeRegex(searchEmailTerm), 'i'))
          .getFilter(),
      ]);
    }

    const filter = query.getFilter();

    const result = await query
      .sort({ [sortBy]: sortDirection })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const totalCount = await this.userModel.countDocuments(filter);

    return {
      page: pageNumber,
      pageSize: pageSize,
      pagesCount: Math.ceil(totalCount / pageSize),
      totalCount: totalCount,
      items: result.map((user) => this.mapUserToViewModel(user)),
    };
  }
}
