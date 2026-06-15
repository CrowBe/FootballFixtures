import type { Context } from 'hono';
import type { RegisterRequest, RegisterResponse } from '@footballfixtures/shared';
import { pushRegistry } from '../push/registry.js';

export async function handleRegister(c: Context): Promise<Response> {
  let body: RegisterRequest;
  try {
    body = await c.req.json<RegisterRequest>();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  const { pushToken, teamIds } = body;

  if (typeof pushToken !== 'string' || pushToken.length === 0) {
    return c.json({ error: 'pushToken is required' }, 400);
  }
  if (!Array.isArray(teamIds)) {
    return c.json({ error: 'teamIds must be an array' }, 400);
  }

  pushRegistry.register(pushToken, teamIds);
  console.log(`[register] token registered for teams: ${teamIds.join(', ')} (total devices: ${pushRegistry.size()})`);

  return c.json({ ok: true } satisfies RegisterResponse);
}
