import { Db, MongoClient } from 'mongodb';
import {
  BLOGS_COLLECTION_NAME,
  COMMENTS_COLLECTION_NAME,
  POSTS_COLLECTION_NAME,
  SESSIONS_COLLECTION_NAME,
  USERS_COLLECTION_NAME,
} from './collections';
import { Blog } from '../modules/blog/types';
import { Post } from '../modules/post/types';
import { CommentDB } from '../modules/comment/types';
import { UserDB } from '../modules/user/infrastructure/types';
import type { SessionDB } from '../modules/security/infrastructure/types';

export class DatabaseConnection {
  constructor({ mongoURL, dbName }: { mongoURL: string; dbName: string }) {
    this.client = new MongoClient(mongoURL);
    this.db = this.client.db(dbName);
  }
  private client: MongoClient;
  private db: Db;

  private async initIndexes() {}

  public async connect() {
    try {
      await this.client.connect();
      await this.db.command({ ping: 1 });
      await this.initIndexes();
      console.log('✅ Connected to the database');
    } catch (e) {
      await this.client.close();
      throw new Error(`❌ Database not connected: ${e}`);
    }
  }

  public getDb(): Db {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db;
  }

  public getClient(): MongoClient {
    if (!this.client) {
      throw new Error('Database not connected');
    }
    return this.client;
  }

  public getCollections() {
    return {
      sessionCollection: this.getDb().collection<SessionDB>(
        SESSIONS_COLLECTION_NAME,
      ),
      usersCollection: this.getDb().collection<UserDB>(USERS_COLLECTION_NAME),
      blogCollection: this.getDb().collection<Blog>(BLOGS_COLLECTION_NAME),
      postsCollection: this.getDb().collection<Post>(POSTS_COLLECTION_NAME),
      commentsCollection: this.getDb().collection<CommentDB>(
        COMMENTS_COLLECTION_NAME,
      ),
    };
  }

  public async drop() {
    const collections = this.getCollections();
    for (const collection of Object.values(collections)) {
      await collection.drop();
    }
  }
}
