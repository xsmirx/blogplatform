import type { BlogDocument, BlogInput } from './types';
import type { Blog, NewBlog } from '../domain/types';
import type { BlogRepository } from '../domain/blog-repository.interface';
import { inject, injectable } from 'inversify';
import { BLOG_MODEL } from './blog-model';
import { Model } from 'mongoose';

@injectable()
export class MongoBlogRepository implements BlogRepository {
  constructor(
    @inject(BLOG_MODEL) protected readonly blogModel: Model<BlogInput>,
  ) {}

  private mapToDomainModel(blog: BlogDocument): Blog {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt,
      isMembership: blog.isMembership,
    };
  }

  public async findById(id: string): Promise<Blog | null> {
    const result = await this.blogModel.findById(id);
    if (result === null) return null;
    return this.mapToDomainModel(result);
  }

  public async create(blog: NewBlog): Promise<string> {
    const result = await this.blogModel.create({ ...blog });
    await result.save();
    return result.id;
  }

  public async update(
    id: string,
    blog: Omit<Blog, 'id' | 'createdAt'>,
  ): Promise<boolean> {
    const result = await this.blogModel.findByIdAndUpdate(id, {
      $set: {
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        isMembership: blog.isMembership,
      },
    });
    if (result === null) return false;
    await result.save();
    return true;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.blogModel.findByIdAndDelete(id);
    if (result === null) return false;
    return true;
  }
}
