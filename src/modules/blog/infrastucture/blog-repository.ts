import { ObjectId, WithId } from 'mongodb';
import { DatabaseConnection } from '../../../bd/mongo.db';
import type { BlogDB } from './types';
import type { Blog, NewBlog } from '../domain/types';
import type { BlogRepository } from '../domain/blog-repository.interface';

export class MongoBlogRepository implements BlogRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().blogCollection;
  }

  private mapToDomainModel(blog: WithId<BlogDB>): Blog {
    return {
      id: blog._id.toString(),
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  public async findById(id: string): Promise<Blog | null> {
    const result = await this.collection.findOne({ _id: new ObjectId(id) });
    if (result === null) return null;
    return this.mapToDomainModel(result);
  }

  public async create(blog: NewBlog): Promise<string> {
    const result = await this.collection.insertOne({ ...blog });
    return result.insertedId.toString();
  }

  public async update(
    id: string,
    blog: Omit<Blog, 'id' | 'createdAt'>,
  ): Promise<boolean> {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          name: blog.name,
          description: blog.description,
          websiteUrl: blog.websiteUrl,
          isMembership: blog.isMembership,
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
