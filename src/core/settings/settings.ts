import dotenv from 'dotenv';

dotenv.config();
// dotenv.config({ path: './.env.production' });

const HOST = process.env.HOST || '0.0.0.0';

const PORT = process.env.PORT || 3000;

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) {
  throw new Error('MONGO_URL not found');
}

const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
if (!MONGO_DB_NAME) {
  throw new Error('MONGO_DB_NAME not found');
}

const AC_TOKEN_SECRET = process.env.AC_TOKEN_SECRET;
if (!AC_TOKEN_SECRET) {
  throw new Error('AC_TOKEN_SECRET not found');
}

const AC_TOKEN_TIME = Number(process.env.AC_TOKEN_TIME);
if (isNaN(AC_TOKEN_TIME)) {
  throw new Error('AC_TOKEN_TIME not found');
}

export const settings = {
  HOST,
  PORT: Number(PORT),
  MONGO_URL,
  MONGO_DB_NAME,
  AC_TOKEN_SECRET,
  AC_TOKEN_TIME,
};
