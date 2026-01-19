import { Db, Document, MongoClient } from 'mongodb';

export class DatabaseConnection {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  public async connect({
    mongoURL,
    dbName,
  }: {
    mongoURL: string;
    dbName: string;
  }) {
    this.client = new MongoClient(mongoURL);
    this.db = this.client.db(dbName);
    try {
      await this.client.connect();
      await this.db.command({ ping: 1 });
      console.log('✅ Connected to the database');
    } catch (e) {
      await this.client.close();
      throw new Error(`❌ Database not connected: ${e}`);
    }
  }

  public async getCollection<TSchema extends Document = Document>(
    name: string,
  ) {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db?.collection<TSchema>(name);
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
}

export const databaseConnection = new DatabaseConnection();
