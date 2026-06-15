import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useGameDetailQuery } from '../../src/api/queries.js';
import { LIVE_STATUSES, FINISHED_STATUSES } from '@footballfixtures/shared';
import { formatKickoffDate, formatKickoffTime } from '../../src/utils/time.js';

const ORANGE = '#F55B00';

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useGameDetailQuery(id ?? '');

  if (isLoading) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centre}>
        <Text style={styles.errorText}>Could not load match details.</Text>
      </View>
    );
  }

  const { game, live } = data;
  const isLive = live ? LIVE_STATUSES.has(live.status) : LIVE_STATUSES.has(game.status);
  const isFinished = live
    ? FINISHED_STATUSES.has(live.status)
    : game.finished;

  const homeScore = live?.homeScore ?? game.homeScore;
  const awayScore = live?.awayScore ?? game.awayScore;
  const status = live?.status ?? game.status;
  const minute = live?.minute;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Round / Group */}
      <Text style={styles.roundLabel}>
        {game.round ?? ''}
        {game.group ? ` · ${game.group}` : ''}
      </Text>

      {/* Teams and score */}
      <View style={styles.matchRow}>
        {/* Home */}
        <View style={styles.teamBlock}>
          <Text style={styles.flag}>{game.homeTeam.flag ?? ''}</Text>
          <Text style={styles.teamName}>{game.homeTeam.name}</Text>
          <Text style={styles.teamCode}>{game.homeTeam.code}</Text>
        </View>

        {/* Centre: score or kickoff */}
        <View style={styles.centre}>
          {isLive || isFinished ? (
            <Text style={[styles.score, isLive && styles.scoreLive]}>
              {homeScore ?? 0}{'  –  '}{awayScore ?? 0}
            </Text>
          ) : (
            <>
              <Text style={styles.kickoffTime}>{formatKickoffTime(game.kickoff)}</Text>
              <Text style={styles.kickoffDate}>{formatKickoffDate(game.kickoff)}</Text>
            </>
          )}

          <StatusBadge status={status} minute={minute} isLive={isLive} isFinished={isFinished} />
        </View>

        {/* Away */}
        <View style={[styles.teamBlock, styles.teamBlockRight]}>
          <Text style={styles.flag}>{game.awayTeam.flag ?? ''}</Text>
          <Text style={styles.teamName}>{game.awayTeam.name}</Text>
          <Text style={styles.teamCode}>{game.awayTeam.code}</Text>
        </View>
      </View>

      {/* Venue */}
      {game.venue ? (
        <Text style={styles.venue}>{game.venue}</Text>
      ) : null}
    </ScrollView>
  );
}

function StatusBadge({
  status,
  minute,
  isLive,
  isFinished,
}: {
  status: string;
  minute?: number;
  isLive: boolean;
  isFinished: boolean;
}) {
  if (isLive) {
    const label = status === 'HT' ? 'Half-time' : minute != null ? `${minute}'` : 'LIVE';
    return (
      <View style={styles.liveBadge}>
        <Text style={styles.liveBadgeText}>{label}</Text>
      </View>
    );
  }
  if (isFinished) {
    const label = status === 'AET' ? 'AET' : status === 'PEN' ? 'Penalties' : 'Full-time';
    return <Text style={styles.ftLabel}>{label}</Text>;
  }
  return null;
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24 },
  centre: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  errorText: { fontSize: 15, color: '#888', textAlign: 'center' },
  roundLabel: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 28,
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  teamBlock: { flex: 1, alignItems: 'flex-start', gap: 6 },
  teamBlockRight: { alignItems: 'flex-end' },
  flag: { fontSize: 40 },
  teamName: { fontSize: 15, fontWeight: '700', color: '#1a1a1a', flexShrink: 1 },
  teamCode: { fontSize: 12, color: '#888' },
  score: { fontSize: 40, fontWeight: '800', color: '#1a1a1a', letterSpacing: -1 },
  scoreLive: { color: ORANGE },
  kickoffTime: { fontSize: 30, fontWeight: '700', color: '#1a1a1a' },
  kickoffDate: { fontSize: 13, color: '#888', marginTop: 4 },
  liveBadge: {
    marginTop: 10,
    backgroundColor: ORANGE,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  liveBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  ftLabel: { marginTop: 10, fontSize: 13, color: '#888', fontWeight: '600' },
  venue: { textAlign: 'center', marginTop: 28, fontSize: 13, color: '#aaa' },
});
