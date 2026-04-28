import { RequestHandler } from 'express';
import { matchedData } from 'express-validator';
import type { BlogService } from '../domain/blog-service';
import type { ListResponse } from '../../../core/types/list-response';
import type { BlogInputDTO, BlogListQueryInput, BlogOutputDTO } from './types';
import type { BlogQueryRepository } from '../infrastucture/blog-query-repository';
import { NotFoundError } from '../../../core/errors/errors';

export const createGetBlogListHandler = ({
  blogQueryRepository,
}: {
  blogQueryRepository: BlogQueryRepository;
}): RequestHandler<object, ListResponse<BlogOutputDTO>> => {
  return async (req, res) => {
    const validationData = matchedData<BlogListQueryInput>(req);

    const { items, totalCount } =
      await blogQueryRepository.findAll(validationData);

    return res.status(200).send({
      page: validationData.pageNumber,
      pageSize: validationData.pageSize,
      pagesCount: Math.ceil(totalCount / validationData.pageSize),
      totalCount: totalCount,
      items,
    });
  };
};

export const createGetBlogHandler = ({
  blogQueryRepository,
}: {
  blogQueryRepository: BlogQueryRepository;
}): RequestHandler<{ id: string }, BlogOutputDTO> => {
  return async (req, res) => {
    const blogId = req.params.id;
    const blog = await blogQueryRepository.findById(blogId);
    if (!blog) throw new NotFoundError('Blog', blogId);
    return res.status(200).send(blog);
  };
};

export const createCreateBlogHandler = ({
  blogService,
  blogQueryRepository,
}: {
  blogService: BlogService;
  blogQueryRepository: BlogQueryRepository;
}): RequestHandler<object, BlogOutputDTO, BlogInputDTO> => {
  return async (req, res) => {
    const { description, name, websiteUrl } = matchedData<BlogInputDTO>(req);
    const newBlogId = await blogService.create({
      description,
      name,
      websiteUrl,
    });
    const newBlog = await blogQueryRepository.findById(newBlogId);
    if (!newBlog)
      throw new Error(
        `Blog ${newBlogId} was created but not found - DB inconsistency`,
      );
    res.status(201).send(newBlog);
  };
};

export const createUpdateBlogHandler = ({
  blogService,
}: {
  blogService: BlogService;
}): RequestHandler<{ id: string }, void, BlogInputDTO> => {
  return async (req, res) => {
    const { id, name, description, websiteUrl } = matchedData<
      { id: string } & BlogInputDTO
    >(req);

    await blogService.update(id, {
      name,
      description,
      websiteUrl,
    });
    res.status(204).send();
  };
};

export const createDeleteBlogHandler = ({
  blogService,
}: {
  blogService: BlogService;
}): RequestHandler<{ id: string }> => {
  return async (req, res) => {
    const { id } = matchedData<{ id: string }>(req);
    await blogService.delete(id);
    res.status(204).send();
  };
};
