import { Collection, Filter, ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd';
import { Blog, BlogListQueryInput } from './types';
import { NotFoundError } from '../../core/errors/errors';

class BlogRepository {
  public getCollection(): Collection<Blog> {
    return databaseConnection.getDb().collection<Blog>('blogs');
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

    const items = await this.getCollection()
      .find(filter)
      .sort(sortBy, sortDirection)
      .skip(skip)
      .limit(pageSize)
      .toArray();

    const totalCount = await this.getCollection().countDocuments(filter);

    return { items, totalCount };
  }

  public async findById(id: string): Promise<WithId<Blog> | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async findByIdOrFail(id: string): Promise<WithId<Blog>> {
    const result = await this.getCollection().findOne({
      _id: new ObjectId(id),
    });
    if (!result) {
      throw new NotFoundError(`Blog with id ${id} not found`);
    }
    return result;
  }

  public async create(blog: Blog): Promise<ObjectId> {
    const result = await this.getCollection().insertOne({ ...blog });
    return result.insertedId;
  }

  public async update(
    id: string,
    blog: Omit<Blog, 'createdAt'>,
  ): Promise<void> {
    const result = await this.getCollection().updateOne(
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
    const result = await this.getCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      throw new NotFoundError(`Blog with id ${id} not found`);
    }

    return;
  }
}

export const blogRepository = new BlogRepository();
