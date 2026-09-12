import 'reflect-metadata';
import express from 'express';
import { settings } from './core/settings/settings';
import { setupApp } from './setup-app';
import { DatabaseConnection } from './db/mongoose.db';
import { container } from './composition-root';

const bootstrap = async () => {
  // connect to DB

  const databaseConnection = new DatabaseConnection(
    settings.MONGO_URL + settings.MONGO_DB_NAME + '?authSource=admin',
  );
  await databaseConnection.connect();

  // создание приложения
  const app = express();

  setupApp(app, container);

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
