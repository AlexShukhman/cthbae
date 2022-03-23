import express from 'express';
import RedisClient from 'ioredis';
import connectRedis from 'connect-redis';
import session from 'express-session';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import {
  env,
  sessionConfig,
  redisConfig,
  redisStoreConfig,
} from './configs';
import routes from './routes';

async function startServer () {
  // Start Redis
  process.redis = new RedisClient(redisConfig);

  // Create Redis Stor
  const RedisStore = connectRedis(session);
  const sessionStore = new RedisStore({
    client: process.redis,
    ...redisStoreConfig,
  });

  const app = express();

  // Use pug
  app.set('views', path.join(__dirname, 'views'));
  app.set('view engine', 'pug');

  // Allows CORS stuff
  app.set('trust proxy', 'loopback');
  app.use(cors({
    origin: '*',
    methods: 'GET,POST',
    allowedHeaders: 'Origin,Content-Type',
  }));

  app.use(bodyParser.json({ limit: '100kb' }));

  // Add session store
  app.use(session({
    store: sessionStore,
    ...sessionConfig,
  }));

  app.use(routes);

  // Start server
  app.listen(env.port);
  console.log(`Server is listening on port ${env.port}`);
}

if (require.main === module) {
  startServer()
    .catch(e => {
      console.error(e);
      process.exit(1);
    });
}
