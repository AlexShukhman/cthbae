import { Router } from 'express';
import { hash } from './utils';
import { env } from './configs';
import { randomUUID as uuid } from 'crypto';

const api = Router();

api.get('/', (_, res) => {
  res.render('index', { title: 'Try me.', meetingId: 'demoId', meetingName: 'super long long long long long long demo name' });
});

api.post('/meeting', async (req, res) => {
  const meetingName = req.body.meetingName;

  if (!meetingName) return res.redirect('/');

  const redisKey = hash(meetingName + uuid());
  await process.redis.set(`${redisKey}:meetingName`, meetingName, 'ex', 60 * 60 * 24 * 7); // lasts a week
  return res.redirect(`/meeting?meetingId=${redisKey}`);
});

api.get('/meeting', async (req, res) => {
  const { meetingId } = req.query;
  if (!meetingId) return res.redirect('/');

  const meetingName = await process.redis.get(`${meetingId}:meetingName`);

  if (!meetingName) return res.redirect('/');

  const meetingResults = (await process.redis.get(`${meetingId}:results`)) || 0;

  return res.render('meeting', {
    title: `Results for ${meetingName}`,
    meetingName,
    meetingLink: `${env.url}/submit?meetingId=${meetingId}`,
    meetingResult: meetingResults > 0 ? 'positive' : (meetingResults < 0 ? 'negative' : 'neutral'),
  });
});

api.get('/submit', async (req, res) => {
  const { meetingId } = req.query;

  if (!meetingId) return res.redirect('/');

  const meetingName = await process.redis.get(`${meetingId}:meetingName`);

  if (!meetingName) return res.redirect('/');

  res.render('submit', { title: `Submit answer for ${meetingName}`, meetingName, meetingId });
});

api.post('/submit', async (req, res) => {
  const { meetingId, cthbae } = req.body;

  if (!meetingId || typeof (cthbae) !== 'boolean') {
    return res.redirect('/fishy?issueCode=badReq');
  } else if ((req.session.meetings || []).includes(meetingId)) {
    return res.redirect(`/fishy?meetingId=${meetingId}&issueCode=resub`);
  }

  const meetingName = await process.redis.get(`${meetingId}:meetingName`);

  if (!meetingName) {
    console.log('missing meetingName', meetingId);
    return res.redirect(`/fishy?meetingId=${meetingId}&code=timeout`);
  }

  await process.redis.incrby(`${meetingId}:results`, cthbae ? -1 : 1);
  await process.redis.expire(`${meetingId}:results`, 60 * 60 * 24 * 7);

  req.session.meetings = [
    ...req.session.meetings || [],
    meetingId,
  ];

  return res.redirect(`/meeting?meetingId=${meetingId}`);
});

api.get('/fishy', (req, res) => {
  const { issueCode, meetingId } = req.query;

  let issue = 'Issue unknown';
  let redirectText = 'Home';
  let redirectURL = '/';
  switch (issueCode) {
    case 'resub':
      issue = 'Looks like you tried to resubmit your answer there, huh, buddy?';
      redirectText = 'Results';
      redirectURL = `/meeting?meetingId=${meetingId}`;
      break;
    case 'timeout':
      issue = 'Either this meeting was discussed a long time ago or never happened. Either way, Seems like a you problem. ¯\\_(ツ)_/¯';
  }

  return res.render('fishy', { issue, redirectText, redirectURL, title: '🐡🐡🐡' });
});

export default api;
