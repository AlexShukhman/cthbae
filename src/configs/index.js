const local = process.env.PROD !== 'true';
export const env = {
  local,
  port: Number(process.env.PORT) || 3000,

  cookieDomain: local ? 'localhost' : '.cthbae.com',
  sessionPrivateKey: process.env.SESSION_PRIVATE_KEY || 'demo',
};

export const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  ...process.env.REDIS_PORT
    ? {
        port: Number(process.env.REDIS_PORT),
      }
    : {},
};

const cookieTTL = 1000 * 60 * 60 * 48; // 2 days in ms

export const redisStoreConfig = {
  prefix: 'sess:',
  ttl: 60 * 60 * 1 + (cookieTTL / 1000), // 1h extra for auto-refresh
};

export const sessionConfig = {
  saveUninitialized: false, // TODO: handle this when necessary
  secret: env.sessionPrivateKey, // the same as the private key for all JWTs
  resave: false, // prevents duplicate writes
  name: 'cthbae.sid',
  cookie: {
    secure: !local,
    domain: env.cookieDomain,
    maxAge: cookieTTL,
  },
};

if (local) {
  delete sessionConfig.cookie.domain;
}
