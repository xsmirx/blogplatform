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

const RC_TOKEN_SECRET = process.env.RC_TOKEN_SECRET;
if (!RC_TOKEN_SECRET) {
  throw new Error('RC_TOKEN_SECRET not found');
}

const RC_TOKEN_TIME = Number(process.env.RC_TOKEN_TIME);
if (isNaN(RC_TOKEN_TIME)) {
  throw new Error('RC_TOKEN_TIME not found');
}

const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
if (!EMAIL_ADDRESS) {
  throw new Error('EMAIL_ADDRESS not found');
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
if (!GOOGLE_CLIENT_ID) {
  throw new Error('GOOGLE_CLIENT_ID not found');
}

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!GOOGLE_CLIENT_SECRET) {
  throw new Error('GOOGLE_CLIENT_SECRET not found');
}

const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
if (!GOOGLE_REFRESH_TOKEN) {
  throw new Error('GOOGLE_REFRESH_TOKEN not found');
}

export const settings = {
  HOST,
  PORT: Number(PORT),
  MONGO_URL,
  MONGO_DB_NAME,
  AC_TOKEN_SECRET,
  AC_TOKEN_TIME,
  RC_TOKEN_SECRET,
  RC_TOKEN_TIME,
  EMAIL_ADDRESS,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
};
