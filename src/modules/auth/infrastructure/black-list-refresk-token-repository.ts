import type { DatabaseConnection } from '../../../bd/mongo.db';

export class BlackListRefreshTokenRepository {
  constructor(protected readonly databaseConnection: DatabaseConnection) {}

  private get collection() {
    return this.databaseConnection.getCollections()
      .blackListRefreshTokenCollection;
  }

  public async addToBlackList({
    refreshToken,
    expiresAt,
  }: {
    refreshToken: string;
    expiresAt: Date;
  }) {
    await this.collection.insertOne({ refreshToken, expiresAt });
  }

  public async isBlackListed(refreshToken: string): Promise<boolean> {
    const token = await this.collection.findOne({ refreshToken });
    return !!token;
  }
}
