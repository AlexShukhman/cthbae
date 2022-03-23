import { Router } from 'express';

const api = Router();

api.get('/', (_, res) => {
  res.render('index', { title: 'Hello World' });
});

export default api;
