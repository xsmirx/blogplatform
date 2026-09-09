import 'reflect-metadata';
import express from 'express';
import { DatabaseConnection } from './db/mongo.db';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { MongooseDatabaseConnection } from './db/mongoose.db';
import { container } from './composition-root';

const bootstrap = async () => {
  // connect to DB
  const databaseConnection = new DatabaseConnection({
    mongoURL: settings.MONGO_URL,
    dbName: settings.MONGO_DB_NAME,
  });
  await databaseConnection.connect();

  const mongooseDatabaseConnection = new MongooseDatabaseConnection(
    settings.MONGO_URL + settings.MONGO_DB_NAME + '?authSource=admin',
  );
  await mongooseDatabaseConnection.connect();

  container.bind(DatabaseConnection).toConstantValue(databaseConnection);

  // создание приложения
  const app = express();

  setupApp(app, container);

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
