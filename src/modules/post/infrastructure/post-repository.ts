import { ObjectId, type WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { PostRepository } from '../domain/post-repository.interface';
import type { NewPost, Post } from '../domain/types';
import type { PostDB } from './types';

export class MongoPostRepository implements PostRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().postsCollection;
  }

  private mapToDomainModel(post: WithId<PostDB>): Post {
    return {
      id: post._id.toString(),
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
      createdAt: post.createdAt,
    };
  }

  public async findById(id: string): Promise<Post | null> {
    const result = await this.collection.findOne({ _id: new ObjectId(id) });
    return result ? this.mapToDomainModel(result) : null;
  }

  public async create(post: NewPost): Promise<string> {
    const result = await this.collection.insertOne({ ...post });
    return result.insertedId.toString();
  }

  public async update(
    id: string,
    post: Omit<Post, 'id' | 'createdAt'>,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
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
    return result.matchedCount > 0;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(id),
    });
    return result.deletedCount > 0;
  }
}
