// Types
export type { Competition, CompetitionType, CompetitionDataSource, ApiFootballSourceConfig } from './types/competition.js';
export type { Game, GameTeamRef, GameStatus } from './types/game.js';
export { LIVE_STATUSES, FINISHED_STATUSES } from './types/game.js';
export type { Team } from './types/team.js';
export type { GroupStanding, StandingEntry } from './types/standing.js';
export type { LiveGameState, GameEvent, NotificationData, GoalNotificationData, HalfTimeNotificationData, FullTimeNotificationData } from './types/live.js';
export type {
  ScheduleResponse,
  StandingsResponse,
  LiveResponse,
  GameDetailResponse,
  RegisterRequest,
  RegisterResponse,
  PollResponse,
  FinalizedGame,
} from './types/payloads.js';

// Adapter interface
export type { DataAdapter, RawGame, RawLiveGame, RawTeamRef } from './adapters/types.js';
