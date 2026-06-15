import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handleSchedule } from './routes/schedule.js';
import { handleStandings } from './routes/standings.js';
import { handleLive } from './routes/live.js';
import { handleGameDetail } from './routes/game.js';
import { handleRegister } from './routes/register.js';
import { handlePoll } from './routes/poll.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ ok: true, service: 'FootballFixtures API', version: '0.1.0' }));

// Public read endpoints
app.get('/schedule', handleSchedule);
app.get('/standings', handleStandings);
app.get('/live', handleLive);
app.get('/games/:id', handleGameDetail);

// Device registration (push token + My team)
app.post('/register', handleRegister);

// Protected — called only by the local poller (shared secret)
app.post('/poll', handlePoll);

const port = Number(process.env['PORT'] ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FootballFixtures server listening on http://localhost:${port}`);
});
