import { ObjectId, WithId } from 'mongodb';
import { databaseConnection } from '../../bd/mongo.db';
import { Post } from './types';
import { PostNotFoundError } from './post-errors';

const dataBase = databaseConnection.getDb();
const postCollection = dataBase.collection<Post>('posts');
class PostRepository {
  public async findAll(): Promise<WithId<Post>[]> {
    return postCollection.find().toArray();
  }

  public findById(id: string): Promise<WithId<Post> | null> {
    return postCollection.findOne({ _id: new ObjectId(id) });
  }

  async findByIdOrFail(id: string): Promise<WithId<Post>> {
    const result = await postCollection.findOne({ _id: new ObjectId(id) });
    if (!result) {
      throw new PostNotFoundError(`Post with id ${id} not found`);
    }
    return result;
  }

  public async create(post: Post): Promise<ObjectId> {
    const result = await postCollection.insertOne({ ...post });
    return result.insertedId;
  }

  public async update(
    id: string,
    post: Omit<Post, 'createdAt'>,
  ): Promise<void> {
    const result = await postCollection.updateOne(
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
    const result = await postCollection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      throw new PostNotFoundError(`Post with id ${id} not found`);
    }

    return;
  }
}

export const postRepository = new PostRepository();
