import type { Comment, NewComment, UpdateComment } from './types';

export interface CommentRepository {
  findById(id: string): Promise<Comment | null>;
  create(comment: NewComment): Promise<string>;
  update(id: string, comment: UpdateComment): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
