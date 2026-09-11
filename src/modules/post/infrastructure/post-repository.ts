import type { PostRepository } from '../domain/post-repository.interface';
import type { NewPost, Post } from '../domain/types';
import { inject, injectable } from 'inversify';
import { POST_MODEL } from './post-model';
import { Model } from 'mongoose';
import { PostDocument, PostInput } from './types';

@injectable()
export class MongoPostRepository implements PostRepository {
  constructor(
    @inject(POST_MODEL)
    protected readonly postModel: Model<PostInput>,
  ) {}

  private mapToDomainModel(post: PostDocument): Post {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt,
    };
  }

  public async findById(id: string): Promise<Post | null> {
    const result = await this.postModel.findById(id);
    return result ? this.mapToDomainModel(result) : null;
  }

  public async create(post: NewPost): Promise<string> {
    const result = await this.postModel.create({ ...post });
    return result.id;
  }

  public async update(
    id: string,
    post: Omit<Post, 'id' | 'createdAt'>,
  ): Promise<boolean> {
    const result = await this.postModel.findByIdAndUpdate(id).set({
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId,
      blogName: post.blogName,
    });
    return result !== null;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.postModel.findByIdAndDelete(id);
    return result !== null;
  }
}
