import { ObjectId, type Filter, type WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { BlogListQueryInput, BlogOutputDTO } from '../api/types';
import type { BlogDB } from './types';
import type { ListResponse } from '../../../core/types/list-response';

export class BlogQueryRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().blogCollection;
  }

  private mapToViewModel(blog: WithId<BlogDB>): BlogOutputDTO {
    return {
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
  }

  public async findById(id: string): Promise<BlogOutputDTO | null> {
    const blog = await this.collection.findOne({ _id: new ObjectId(id) });
    return blog ? this.mapToViewModel(blog) : null;
  }

  public async findAll(
    query: BlogListQueryInput,
  ): Promise<ListResponse<BlogOutputDTO>> {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      query;

    const skip = (pageNumber - 1) * pageSize;

    const filter: Filter<BlogDB> = {};

    if (searchNameTerm) {
      filter.name = { $regex: searchNameTerm, $options: 'i' };
    }

    const items = await this.collection
      .find(filter)
      .sort(sortBy, sortDirection)
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const mappedItems = items.map((item) => this.mapToViewModel(item));

    const totalCount = await this.collection.countDocuments(filter);

    return {
      page: pageNumber,
      pageSize,
      pagesCount: Math.ceil(totalCount / pageSize),
      totalCount,
      items: mappedItems,
    };
  }
}
