import type { GameStatus } from './game.js';

export interface LiveGameState {
  gameId: string;
  competitionId: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  /** Elapsed minutes, if provided by the upstream source. */
  minute?: number;
  /** ISO 8601 — when this state was last updated by the server. */
  updatedAt: string;
}

// ---- Events detected by the poll diff ---------------------------------------

interface GoalEvent {
  type: 'goal';
  side: 'home' | 'away';
}

interface HalfTimeEvent {
  type: 'half-time';
}

interface FullTimeEvent {
  type: 'full-time';
}

interface GameEventBase {
  gameId: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

export type GameEvent = GameEventBase & (GoalEvent | HalfTimeEvent | FullTimeEvent);

// ---- Notification payload shapes (sent in Expo push data field) -------------

export interface GoalNotificationData {
  event: 'goal';
  gameId: string;
  competitionId: string;
}

export interface HalfTimeNotificationData {
  event: 'half-time';
  gameId: string;
  competitionId: string;
}

export interface FullTimeNotificationData {
  event: 'full-time';
  gameId: string;
  competitionId: string;
}

export type NotificationData =
  | GoalNotificationData
  | HalfTimeNotificationData
  | FullTimeNotificationData;
