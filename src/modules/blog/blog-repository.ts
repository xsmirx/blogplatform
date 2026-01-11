import { db } from '../../bd';
import { BlogDTO } from './types';

class BlogRepository {
  findAll() {
    return db.blogs;
  }

  findById(id: string) {
    return db.blogs.find((blog) => blog.id === id) ?? null;
  }

  create(blog: BlogDTO) {
    const newBLog = { id: Date.now().toString(), ...blog };
    db.blogs.push(newBLog);
    return newBLog;
  }

  update(id: string, dto: BlogDTO) {
    const blog = db.blogs.find((blog) => blog.id === id);
    if (!blog) {
      throw new Error('Blog not found');
    }

    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;

    return blog;
  }

  delete(id: string) {
    const index = db.blogs.findIndex((blog) => blog.id === id);

    if (index === -1) {
      throw new Error('Blog not exist');
    }

    db.blogs.splice(index, 1);
    return true;
  }
}

export const blogRepository = new BlogRepository();
