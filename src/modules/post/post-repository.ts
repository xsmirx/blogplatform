import { Collection, Filter, ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd/mongo.db';
import { Post, PostListQueryInput } from './types';
import { PostNotFoundError } from './post-errors';

class PostRepository {
  public getCollection(): Collection<Post> {
    return databaseConnection.getDb().collection<Post>('posts');
  }

  public async findAll(
    query: PostListQueryInput & { blogId?: string },
  ): Promise<{ items: WithId<Post>[]; totalCount: number }> {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } = query;

    const skip = (pageNumber - 1) * pageSize;

    const filter: Filter<Post> = {};

    if (blogId) {
      filter.blogId = blogId;
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

  public findById(id: string): Promise<WithId<Post> | null> {
    return this.getCollection().findOne({ _id: new ObjectId(id) });
  }

  async findByIdOrFail(id: string): Promise<WithId<Post>> {
    const result = await this.getCollection().findOne({
      _id: new ObjectId(id),
    });
    if (!result) {
      throw new PostNotFoundError(`Post with id ${id} not found`);
    }
    return result;
  }

  public async create(post: Post): Promise<ObjectId> {
    const result = await this.getCollection().insertOne({ ...post });
    return result.insertedId;
  }

  public async update(
    id: string,
    post: Omit<Post, 'createdAt'>,
  ): Promise<void> {
    const result = await this.getCollection().updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title: post.title,
          shortDescription: post.shortDescription,
          content: post.content,
          blogId: post.blogId,
          blogName: post.blogName,
        },
      },
    );

    if (result.matchedCount === 0) {
      throw new PostNotFoundError(`Post with id ${id} not found`);
    }

    return;
  }

  public async delete(id: string): Promise<void> {
    const result = await this.getCollection().deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      throw new PostNotFoundError(`Post with id ${id} not found`);
    }

    return;
  }
}

export const postRepository = new PostRepository();
