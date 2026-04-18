import { ObjectId, type WithId } from 'mongodb';
import type { DatabaseConnection } from '../../../bd/mongo.db';
import type { Session, SessionDB } from './types';

export class SessionRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections().sessionCollection;
  }

  private mapToDomain(doc: WithId<SessionDB>): Session {
    return {
      id: doc._id.toString(),
      userId: doc.userId,
      ip: doc.ip,
      deviceName: doc.deviceName,
      createdAt: doc.createdAt,
      expiresAt: doc.expiresAt,
    };
  }

  public async findById(sessionId: string): Promise<Session | null> {
    const result = await this.collection.findOne({
      _id: new ObjectId(sessionId),
    });
    if (!result) return null;

    return this.mapToDomain(result);
  }

  public async create(session: Session) {
    const result = await this.collection.insertOne({
      userId: session.userId,
      ip: session.ip,
      deviceName: session.deviceName,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
    });

    return result.insertedId.toString();
  }

  public async updateById(sessionId: string, session: SessionDB) {
    const result = await this.collection.updateOne(
      { _id: new ObjectId(sessionId) },
      {
        $set: {
          userId: session.userId,
          ip: session.ip,
          deviceName: session.deviceName,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        },
      },
    );

    return result.matchedCount > 0;
  }

  public async deleteById(sessionId: string) {
    const result = await this.collection.deleteOne({
      _id: new ObjectId(sessionId),
    });

    return result.deletedCount > 0;
  }
}
