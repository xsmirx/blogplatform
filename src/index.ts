import express from 'express';
import { databaseConnection } from './bd/mongo.db';
import { settings } from './core/settings/settings';

const bootstrap = async () => {
  // connect tot DB
  await databaseConnection.connect({
    mongoURL: settings.MONGO_URL,
    dbName: settings.MONGO_DB_NAME,
  });

  const { setupApp } = await import('./setup-app.js');

  // создание приложения
  const app = express();
  setupApp(app);

  // запуск приложения
  app.listen(settings.PORT, settings.HOST, () => {
    console.log(`Example app listening on port ${settings.PORT}`);
  });
};

bootstrap();
