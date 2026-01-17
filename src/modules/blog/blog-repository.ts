import { ObjectId, WithId } from 'mongodb';
import { BlogNotFoundError } from './blog-errors';
import { Blog, databaseConnection } from '../../bd';

const dataBase = databaseConnection.getDb();
const blogCollection = dataBase.collection<Blog>('blogs');

class BlogRepository {
  public async findAll(): Promise<WithId<Blog>[]> {
    return blogCollection.find().toArray();
  }

  public async findById(id: string): Promise<WithId<Blog> | null> {
    return blogCollection.findOne({ _id: new ObjectId(id) });
  }

  async findByIdOrFail(id: string): Promise<WithId<Blog>> {
    const result = await blogCollection.findOne({ _id: new ObjectId(id) });
    if (!result) {
      throw new BlogNotFoundError(`Blog with id ${id} not found`);
    }
    return result;
  }

  public async create(blog: Blog): Promise<ObjectId> {
    const result = await blogCollection.insertOne({ ...blog });
    return result.insertedId;
  }

  public async update(
    id: string,
    blog: Omit<Blog, 'createdAt'>,
  ): Promise<void> {
    const result = await blogCollection.updateOne(
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
    const result = await blogCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new BlogNotFoundError(`Blog with id ${id} not found`);
    }

    return;
  }
}

export const blogRepository = new BlogRepository();
