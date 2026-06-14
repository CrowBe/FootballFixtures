import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

const app = new Hono();

app.use('*', logger());
app.use('*', cors());

app.get('/', (c) => c.json({ ok: true, service: 'FootballFixtures API', version: '0.1.0' }));

// ---------------------------------------------------------------------------
// Routes — stubs; full implementations added in Milestone 2 (schedule/standings)
// and Milestone 3 (live/poll).
// ---------------------------------------------------------------------------

app.get('/schedule', (c) => {
  return c.json({ error: 'Not yet implemented' }, 501);
});

app.get('/standings', (c) => {
  return c.json({ error: 'Not yet implemented' }, 501);
});

app.get('/live', (c) => {
  return c.json({ error: 'Not yet implemented' }, 501);
});

app.get('/games/:id', (c) => {
  return c.json({ error: 'Not yet implemented' }, 501);
});

app.post('/register', async (c) => {
  return c.json({ error: 'Not yet implemented' }, 501);
});

app.post('/poll', async (c) => {
  return c.json({ error: 'Not yet implemented' }, 501);
});

// ---------------------------------------------------------------------------

const port = Number(process.env['PORT'] ?? 3000);

serve({ fetch: app.fetch, port }, () => {
  console.log(`FootballFixtures server listening on http://localhost:${port}`);
});
