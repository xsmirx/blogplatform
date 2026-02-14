import { Collection, Document } from 'mongodb';
import { DatabaseConnection } from '../../bd/mongo.db';

export class BaseRepository<T extends Document> {
  constructor(
    protected readonly collectionName: string,
    protected readonly deps: { databaseConnection: DatabaseConnection },
  ) {}

  protected get collection(): Collection<T> {
    return this.deps.databaseConnection
      .getDb()
      .collection<T>(this.collectionName);
  }
}
