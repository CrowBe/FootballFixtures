import { useQuery } from '@tanstack/react-query';
import type { ScheduleResponse, StandingsResponse } from '@footballfixtures/shared';
import { apiFetch } from './client.js';

/** Query key factories — stable strings, easy to invalidate. */
export const queryKeys = {
  schedule: (competitionId: string) => ['schedule', competitionId] as const,
  standings: (competitionId: string) => ['standings', competitionId] as const,
  live: (competitionId: string) => ['live', competitionId] as const,
};

export function useScheduleQuery(competitionId: string) {
  return useQuery({
    queryKey: queryKeys.schedule(competitionId),
    queryFn: async () => {
      const { data } = await apiFetch<ScheduleResponse>(`/schedule`);
      return data;
    },
    // Server-driven TTL: mirror ttlSeconds into both staleTime and refetchInterval
    staleTime: (query) => {
      const ttl = query.state.data?.ttlSeconds;
      return ttl != null ? ttl * 1000 : 60_000;
    },
    refetchInterval: (query) => {
      const ttl = query.state.data?.ttlSeconds;
      return ttl != null ? ttl * 1000 : 60_000;
    },
    // Only refetch in foreground — push covers background freshness
    refetchIntervalInBackground: false,
  });
}

export function useStandingsQuery(competitionId: string) {
  return useQuery({
    queryKey: queryKeys.standings(competitionId),
    queryFn: async () => {
      const { data } = await apiFetch<StandingsResponse>(`/standings`);
      return data;
    },
    staleTime: (query) => {
      const ttl = query.state.data?.ttlSeconds;
      return ttl != null ? ttl * 1000 : 60_000;
    },
    refetchInterval: (query) => {
      const ttl = query.state.data?.ttlSeconds;
      return ttl != null ? ttl * 1000 : 60_000;
    },
    refetchIntervalInBackground: false,
  });
}
