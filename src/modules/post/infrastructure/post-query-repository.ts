import type { Filter, WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { PostListQueryInput, PostOutputDTO } from '../api/types';
import type { PostDB } from './types';

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

  public async findAll(
    query: PostListQueryInput & { blogId?: string },
  ): Promise<{ items: PostOutputDTO[]; totalCount: number }> {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } = query;

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

    return { items: items.map(this.mapToViewModel), totalCount };
  }
}
