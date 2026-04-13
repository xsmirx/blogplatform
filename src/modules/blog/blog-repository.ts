import { Filter, ObjectId, WithId } from 'mongodb';
import { Blog, BlogListQueryInput } from './types';
import { NotFoundError } from '../../core/errors/errors';
import { DatabaseConnection } from '../../bd/mongo.db';

export class BlogRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().blogCollection;
  }

  public async findAll(query: BlogListQueryInput): Promise<{
    items: WithId<Blog>[];
    totalCount: number;
  }> {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      query;

    const skip = (pageNumber - 1) * pageSize;

    const filter: Filter<Blog> = {};

    if (searchNameTerm) {
      filter.name = { $regex: searchNameTerm, $options: 'i' };
    }

    const items = await this.collection
      .find(filter)
      .sort(sortBy, sortDirection)
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const totalCount = await this.collection.countDocuments(filter);

    return { items, totalCount };
  }

  public async findById(id: string): Promise<WithId<Blog> | null> {
    return this.collection.findOne({ _id: new ObjectId(id) });
  }

  async findByIdOrFail(id: string): Promise<WithId<Blog>> {
    const result = await this.collection.findOne({
      _id: new ObjectId(id),
    });
    if (!result) {
      throw new NotFoundError(`Blog with id ${id} not found`);
    }
    return result;
  }

  public async create(blog: Blog): Promise<ObjectId> {
    const result = await this.collection.insertOne({ ...blog });
    return result.insertedId;
  }

  public async update(
    id: string,
    blog: Omit<Blog, 'createdAt'>,
  ): Promise<void> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: blog.name,
          description: blog.description,
          websiteUrl: blog.websiteUrl,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new NotFoundError(`Blog with id ${id} not found`);
    }

    return;
  }

  public async delete(id: string): Promise<void> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError(`Blog with id ${id} not found`);
    }

    return;
  }
}

