import { Expo } from 'expo-server-sdk';
import type { GameEvent, NotificationData } from '@footballfixtures/shared';
import { pushRegistry } from './registry.js';

const expo = new Expo();

// ---- Notification copy (punchy, per spec) ------------------------------------

function buildMessage(event: GameEvent): { title: string; body: string } {
  if (event.type === 'goal') {
    const scoringName = event.side === 'home' ? event.homeTeamName : event.awayTeamName;
    return {
      title: `GOAL! ${scoringName} ${event.homeScore}–${event.awayScore}`,
      body: `${event.homeTeamName} vs ${event.awayTeamName}`,
    };
  }
  if (event.type === 'half-time') {
    return {
      title: `Half-time: ${event.homeTeamName} ${event.homeScore}–${event.awayScore} ${event.awayTeamName}`,
      body: '',
    };
  }
  return {
    title: `Full-time: ${event.homeTeamName} ${event.homeScore}–${event.awayScore} ${event.awayTeamName}`,
    body: '',
  };
}

function buildData(event: GameEvent): NotificationData {
  if (event.type === 'goal') {
    return { event: 'goal', gameId: event.gameId, competitionId: event.competitionId };
  }
  if (event.type === 'half-time') {
    return { event: 'half-time', gameId: event.gameId, competitionId: event.competitionId };
  }
  return { event: 'full-time', gameId: event.gameId, competitionId: event.competitionId };
}

// ---- Fan-out -----------------------------------------------------------------

export async function fanOut(event: GameEvent): Promise<void> {
  const tokens = pushRegistry.getTokensForTeams([event.homeTeamId, event.awayTeamId]);
  if (tokens.length === 0) return;

  const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
  if (validTokens.length === 0) return;

  const { title, body } = buildMessage(event);
  const data = buildData(event);

  // Expo SDK batches tokens in chunks of 100 automatically
  const messages = validTokens.map((to) => ({
    to,
    title,
    body: body || undefined,
    data,
    sound: 'default' as const,
    channelId: 'goals',  // Android notification channel (created in app)
  }));

  const chunks = expo.chunkPushNotifications(messages);
  const results = await Promise.allSettled(
    chunks.map((chunk) => expo.sendPushNotificationsAsync(chunk)),
  );

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[push] chunk failed:', result.reason);
    }
  }
}
