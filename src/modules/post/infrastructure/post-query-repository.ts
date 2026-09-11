import type { PostListQueryInput, PostOutputDTO } from '../api/types';
import type { ListResponse } from '../../../core/types/list-response';
import { inject, injectable } from 'inversify';
import { POST_MODEL } from './post-model';
import { Model } from 'mongoose';
import { PostDocument, PostInput } from './types';

@injectable()
export class PostQueryRepository {
  constructor(
    @inject(POST_MODEL)
    protected readonly postModel: Model<PostInput>,
  ) {}

  private mapToViewModel(post: PostDocument): PostOutputDTO {
    return {
      id: post.id,
      title: post.title,
      shortDescription: post.shortDescription,
      content: post.content,
      blogId: post.blogId.toString(),
      blogName: post.blogName,
      createdAt: post.createdAt.toISOString(),
    };
  }

  public async findById(id: string): Promise<PostOutputDTO | null> {
    const post = await this.postModel.findById(id);
    return post ? this.mapToViewModel(post) : null;
  }

  public async findAll(
    input: PostListQueryInput,
  ): Promise<ListResponse<PostOutputDTO>> {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } = input;

    const query = this.postModel.find();

    if (blogId) {
      query.where('blogId').equals(blogId);
    }
    const filter = query.getFilter();

    const skip = (pageNumber - 1) * pageSize;
    const result = await query
      .sort({ [sortBy]: sortDirection })
      .skip(skip)
      .limit(pageSize);

    const totalCount = await this.postModel.countDocuments(filter);

    return {
      page: pageNumber,
      pageSize: pageSize,
      pagesCount: Math.ceil(totalCount / pageSize),
      totalCount: totalCount,
      items: result.map((item) => this.mapToViewModel(item)),
    };
  }
}
