import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { handleSchedule } from './routes/schedule.js';
import { handleStandings } from './routes/standings.js';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ ok: true, service: 'FootballFixtures API', version: '0.1.0' }));

app.get('/schedule', handleSchedule);
app.get('/standings', handleStandings);

// Milestone 3: live layer
app.get('/live', (c) => c.json({ error: 'Not yet implemented' }, 501));
app.get('/games/:id', (c) => c.json({ error: 'Not yet implemented' }, 501));
app.post('/register', async (c) => c.json({ error: 'Not yet implemented' }, 501));
app.post('/poll', async (c) => c.json({ error: 'Not yet implemented' }, 501));

const port = Number(process.env['PORT'] ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FootballFixtures server listening on http://localhost:${port}`);
});
