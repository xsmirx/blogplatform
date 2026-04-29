import { RequestHandler } from 'express';
import type { PostService } from '../domain/post-service';
import type { PostQueryRepository } from '../infrastructure/post-query-repository';
import type { ListResponse } from '../../../core/types/list-response';
import type { PostInputDTO, PostListQueryInput, PostOutputDTO } from './types';
import { matchedData } from 'express-validator';
import { NotFoundError } from '../../../core/errors/errors';

export const createGetPostListHandler = ({
  postQueryRepository,
}: {
  postQueryRepository: PostQueryRepository;
}): RequestHandler<{ blogId?: string }, ListResponse<PostOutputDTO>> => {
  return async (req, res) => {
    const { pageNumber, pageSize, sortBy, sortDirection, blogId } = matchedData<
      PostListQueryInput & { blogId?: string }
    >(req);

    const result = await postQueryRepository.findAll({
      pageNumber,
      pageSize,
      sortBy,
      sortDirection,
      blogId,
    });

    return res.status(200).send(result);
  };
};

export const createGetPostHandler = ({
  postQueryRepository,
}: {
  postQueryRepository: PostQueryRepository;
}): RequestHandler<{ id: string }, PostOutputDTO> => {
  return async (req, res) => {
    const { id: postId } = matchedData<{ id: string }>(req);
    const post = await postQueryRepository.findById(postId);
    if (!post) throw new NotFoundError('Post', postId);
    return res.status(200).send(post);
  };
};

export const createCreatePostHandler = ({
  postService,
  postQueryRepository,
}: {
  postService: PostService;
  postQueryRepository: PostQueryRepository;
}): RequestHandler<{ blogId?: string }, PostOutputDTO, PostInputDTO> => {
  return async (req, res) => {
    const { title, shortDescription, content, blogId } =
      matchedData<PostInputDTO>(req);

    const newPostId = await postService.create({
      blogId,
      content,
      shortDescription,
      title,
    });

    const newPost = await postQueryRepository.findById(newPostId);
    if (!newPost)
      throw new Error(
        `Post ${newPostId} was created but not found - DB inconsistency`,
      );

    return res.status(201).send(newPost);
  };
};

export const createUpdatePostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<{ id: string }, void, PostInputDTO> => {
  return async (req, res) => {
    const {
      id: postId,
      title,
      shortDescription,
      content,
      blogId,
    } = matchedData<PostInputDTO & { id: string }>(req);

    await postService.update(postId, {
      title,
      shortDescription,
      content,
      blogId,
    });

    return res.status(204).send();
  };
};

export const createDeletePostHandler = ({
  postService,
}: {
  postService: PostService;
}): RequestHandler<{ id: string }> => {
  return async (req, res) => {
    const { id: postId } = matchedData<{ id: string }>(req);
    await postService.delete(postId);
    return res.status(204).send();
  };
};

// export const createGetCommentListHandler = ({
//   postService,
//   commentQueryRepository,
// }: {
//   postService: PostService;
//   commentQueryRepository: CommentQueryRepository;
// }): RequestHandler<{ id: string }, ListResponse<CommentOutputDTO>> => {
//   return async (req, res) => {
//     const { id, pageNumber, pageSize, sortBy, sortDirection } = matchedData<
//       { id: string } & CommentListQueryInput
//     >(req);

//     await postService.findByIdOrFail(id);

//     const result = await commentQueryRepository.findAllByPostId({
//       postId: id,
//       pageNumber,
//       pageSize,
//       sortBy,
//       sortDirection,
//     });
//     res.status(200).send(result);
//   };
// };

// export const createCreateCommentHandler = ({
//   postService,
//   commentService,
//   commentQueryRepository,
// }: {
//   postService: PostService;
//   commentService: CommentService;
//   commentQueryRepository: CommentQueryRepository;
// }): RequestHandler<{ id: string }, CommentOutputDTO, CommentInputDTO> => {
//   return async (req, res) => {
//     const userId = req.appContext!.user!.userId;
//     const { id, content } = matchedData<{ id: string } & CommentInputDTO>(req);

//     await postService.findByIdOrFail(id);

//     const commentId = await commentService.createComment({
//       postId: id,
//       userId,
//       content,
//     });
//     const comment = await commentQueryRepository.findById(commentId);
//     res.status(201).send(comment);
//   };
// };
