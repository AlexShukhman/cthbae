import { Router } from 'express';
import { hash } from './utils';
import { env } from './configs';

const api = Router();

api.get('/', (_, res) => {
  res.render('index', { title: 'Hello World', meetingId: 'demoId', meetingName: 'super long long long long long long demo name' });
});

api.post('/meeting', async (req, res) => {
  const meetingName = req.body.meetingName;

  if (!meetingName) return res.redirect('/');

  const redisKey = hash(meetingName);
  await process.redis.set(`${redisKey}:meetingName`, meetingName, 'ex', 60 * 60 * 24 * 7); // lasts a week
  return res.redirect(`/meetingInfo?meetingId=${redisKey}`);
});

api.get('/meetingInfo', async (req, res) => {
  const { meetingId } = req.query;
  if (!meetingId) return res.redirect('/');

  const meetingName = await process.redis.get(`${meetingId}:meetingName`);

  if (!meetingName) return res.redirect('/');

  const meetingResults = (await process.redis.get(`${meetingId}:meetingResults`)) || 0;

  return res.render('meetingInfo', {
    title: `Results for ${meetingName}`,
    meetingLink: `${env.url}/submit?meetingId=${meetingId}`,
    meetingResult: meetingResults > 0 ? 'positive' : (meetingResults < 0 ? 'negative' : 'neutral'),
  });
});

export default api;
