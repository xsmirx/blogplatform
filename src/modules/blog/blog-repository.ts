import { Collection, ObjectId, WithId } from 'mongodb';
import { BlogNotFoundError } from './blog-errors';
import { databaseConnection } from '../../bd';
import { Blog } from './types';

class BlogRepository {
  public getCollection(): Collection<Blog> {
    return databaseConnection.getDb().collection<Blog>('blogs');
  }

  public async findAll(): Promise<WithId<Blog>[]> {
    return this.getCollection().find().toArray();
  }

  public async findById(id: string): Promise<WithId<Blog> | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async findByIdOrFail(id: string): Promise<WithId<Blog>> {
    const result = await this.getCollection().findOne({
      _id: new ObjectId(id),
    });
    if (!result) {
      throw new BlogNotFoundError(`Blog with id ${id} not found`);
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
      throw new BlogNotFoundError(`Blog with id ${id} not found`);
    }

    return;
  }

  public async delete(id: string): Promise<void> {
    const result = await this.getCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      throw new BlogNotFoundError(`Blog with id ${id} not found`);
    }

    return;
  }
}

export const blogRepository = new BlogRepository();
