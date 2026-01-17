import { databaseConnection } from '../../bd/mongo.db';
import { PostDTO } from './types';

const dataBase = databaseConnection.getDb();
const postsCollection = dataBase.collection('posts');
class PostRepository {
  public async findAll() {
    const posts = await postsCollection.find().toArray();
    console.log(posts);

    return postsCollection.find();
  }

  public findById(id: string) {
    // return db.posts.find((post) => post.id === id) || null;
  }

  public create(post: PostDTO) {
    // const blogName = db.blogs.find((blog) => blog.id === post.blogId)?.name;
    // if (!blogName) {
    //   throw new Error('Blog not found');
    // }
    // const newPost = { id: Date.now().toString(), ...post, blogName };
    // db.posts.push(newPost);
    // return newPost;
  }

  public update(id: string, dto: PostDTO) {
    // const post = db.posts.find((post) => post.id === id);
    // if (!post) {
    //   throw new Error('Post not found');
    // }
    // if (dto.blogId && !db.blogs.find((blog) => blog.id === dto.blogId)) {
    //   throw new Error('Blog not found');
    // }
    // post.title = dto.title ?? post.title;
    // post.shortDescription = dto.shortDescription ?? post.shortDescription;
    // post.content = dto.content ?? post.content;
    // post.blogId = dto.blogId ?? post.blogId;
    // post.blogName = dto.blogId
    //   ? db.blogs.find((blog) => blog.id === dto.blogId)!.name
    //   : post.blogName;
    // return post;
  }

  public delete(id: string) {
    // const index = db.posts.findIndex((post) => post.id === id);
    // if (index === -1) {
    //   throw new Error('Post not exist');
    // }
    // db.posts.splice(index, 1);
    // return true;
  }
}

export const postRepository = new PostRepository();
