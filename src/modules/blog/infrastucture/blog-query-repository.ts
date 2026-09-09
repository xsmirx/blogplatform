import type { BlogListQueryInput, BlogOutputDTO } from '../api/types';
import type { BlogDocument, BlogInput } from './types';
import type { ListResponse } from '../../../core/types/list-response';
import { inject, injectable } from 'inversify';
import { BLOG_MODEL } from './blog-model';
import { Model } from 'mongoose';

@injectable()
export class BlogQueryRepository {
  constructor(
    @inject(BLOG_MODEL) protected readonly blogModel: Model<BlogInput>,
  ) {}

  private mapToViewModel(blog: BlogDocument): BlogOutputDTO {
    return {
      id: blog.id,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: blog.createdAt.toISOString(),
      isMembership: blog.isMembership,
    };
  }

  public async findById(id: string): Promise<BlogOutputDTO | null> {
    const blog = await this.blogModel.findById(id);
    return blog ? this.mapToViewModel(blog) : null;
  }

  public async findAll(
    query: BlogListQueryInput,
  ): Promise<ListResponse<BlogOutputDTO>> {
    const { pageNumber, pageSize, sortBy, sortDirection, searchNameTerm } =
      query;

    const blogQuery = this.blogModel.find();

    if (searchNameTerm) {
      blogQuery.where('name').regex(new RegExp(searchNameTerm, 'i'));
    }
    const filter = blogQuery.getFilter();
    const skip = (pageNumber - 1) * pageSize;
    const items = await blogQuery
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize)
      .exec();

    const mappedItems = items.map((item) => this.mapToViewModel(item));

    const totalCount = await this.blogModel.countDocuments(filter);

    return {
      page: pageNumber,
      pageSize,
      pagesCount: Math.ceil(totalCount / pageSize),
      totalCount,
      items: mappedItems,
    };
  }
}
