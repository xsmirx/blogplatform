import { ObjectId, type Filter, type WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { PostListQueryInput, PostOutputDTO } from '../api/types';
import type { PostDB } from './types';
import type { ListResponse } from '../../../core/types/list-response';

export class PostQueryRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().postsCollection;
  }

  private mapToViewModel(post: WithId<PostDB>): PostOutputDTO {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
    };
  }

  public async findById(id: string): Promise<PostOutputDTO | null> {
    const post = await this.collection.findOne({ _id: new ObjectId(id) });
    return post ? this.mapToViewModel(post) : null;
  }

  public async findAll(
    input: PostListQueryInput,
  ): Promise<ListResponse<PostOutputDTO>> {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } = input;

    const skip = (pageNumber - 1) * pageSize;

    const filter: Filter<PostDB> = {};

    if (blogId) {
      filter.blogId = blogId;
    }

    const items = await this.collection
      .find(filter)
      .sort(sortBy, sortDirection)
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const totalCount = await this.collection.countDocuments(filter);

    return {
      page: pageNumber,
      pageSize: pageSize,
      pagesCount: Math.ceil(totalCount / pageSize),
      totalCount: totalCount,
      items: items.map((item) => this.mapToViewModel(item)),
    };
  }
}
