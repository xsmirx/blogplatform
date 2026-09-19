import { inject, injectable } from 'inversify';
import { NotFoundError } from '../../../core/errors/domain-errors';
import {
  BLOG_REPOSITORY,
  type BlogRepository,
} from '../../blog/domain/blog-repository.interface';
import type { CreatePostInput, UpdatePostInput } from './types';
import { LikeStatus } from '../../likes/domain/like-model';
import { LikeService } from '../../likes/application/like-service';
import { MongoPostRepository } from '../infrastructure/post-repository';
import { POST_MODEL, PostModel } from '../domain/post-model';
import { Types } from 'mongoose';

@injectable()
export class PostService {
  constructor(
    @inject(BLOG_REPOSITORY) protected readonly blogRepository: BlogRepository,
    @inject(MongoPostRepository)
    protected readonly postRepository: MongoPostRepository,
    @inject(POST_MODEL) protected readonly PostModel: PostModel,
    @inject(LikeService) protected readonly likeService: LikeService,
  ) {}

  public async create(input: CreatePostInput): Promise<string> {
    const { blogId, content, shortDescription, title } = input;

    const blog = await this.blogRepository.findById(blogId);
    if (!blog) throw new NotFoundError('Blog', blogId);

    const post = new this.PostModel({
      title,
      shortDescription,
      content,
      blogId,
      blogName: blog.name,
    });
    await this.postRepository.save(post);
    return post.id;
  }

  public async update(id: string, input: UpdatePostInput): Promise<void> {
    const { blogId, content, shortDescription, title } = input;

    const blog = await this.blogRepository.findById(blogId);
    if (!blog) throw new NotFoundError('Blog', blogId);

    const post = await this.postRepository.findById(id);
    if (!post) throw new NotFoundError('Post', id);
    post.title = title;
    post.shortDescription = shortDescription;
    post.content = content;
    post.blogId = new Types.ObjectId(blogId);
    post.blogName = blog.name;
    await this.postRepository.save(post);
  }

  public async updateLikeStatus(
    userId: string,
    postId: string,
    likeStatus: LikeStatus,
  ) {
    const post = await this.postRepository.findById(postId);
    if (!post) throw new NotFoundError('post', postId);
    await this.likeService.updateLikeStatus(userId, postId, likeStatus);
    const likesCount = await this.likeService.getLikesCount(postId);
    const newestLikes = await this.likeService.getNewestLikes(postId);
    post.likesCount = likesCount.likesCount;
    post.dislikesCount = likesCount.dislikesCount;
    post.set(
      'newestLikes',
      newestLikes.map((like) => ({
        userId: like.userId,
        login: like.login,
        addedAt: like.createdAt,
      })),
    );
    await this.postRepository.save(post);
  }

  public async delete(id: string): Promise<void> {
    const result = await this.postRepository.delete(id);
    if (!result) throw new NotFoundError('Post', id);
  }
}
