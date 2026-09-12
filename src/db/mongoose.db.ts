import mongoose from 'mongoose';

export class DatabaseConnection {
  constructor(protected readonly mongoURL: string) {}

  public async connect() {
    try {
      await mongoose.connect(this.mongoURL);
      console.log('Mongoosee connected');
    } catch (e) {
      console.log('Mongoose not connected');
      console.error(e);
      await mongoose.disconnect();
    }
  }

  public async disconnect() {
    await mongoose.disconnect();
  }
}
