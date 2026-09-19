import { inject, injectable } from 'inversify';
import { POST_MODEL, PostDocument, PostModel } from '../domain/post-model';

@injectable()
export class MongoPostRepository {
  constructor(
    @inject(POST_MODEL)
    protected readonly postModel: PostModel,
  ) {}

  public async findById(id: string) {
    const result = await this.postModel.findById(id);
    return result;
  }

  public async delete(id: string): Promise<boolean> {
    const result = await this.postModel.findByIdAndDelete(id);
    return result !== null;
  }

  public async save(post: PostDocument) {
    await post.save();
  }
}
