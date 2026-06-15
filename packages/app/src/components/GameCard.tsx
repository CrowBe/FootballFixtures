import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import type { Game, LiveGameState } from '@footballfixtures/shared';
import { LIVE_STATUSES, FINISHED_STATUSES } from '@footballfixtures/shared';
import { formatKickoffTime } from '../utils/time.js';

interface Props {
  game: Game;
  live?: LiveGameState;
}

export function GameCard({ game, live }: Props) {
  const router = useRouter();

  const status = live?.status ?? game.status;
  const isLive = LIVE_STATUSES.has(status);
  const isFinished = live ? FINISHED_STATUSES.has(status) : game.finished;
  const homeScore = live?.homeScore ?? game.homeScore;
  const awayScore = live?.awayScore ?? game.awayScore;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/game/${game.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${game.homeTeam.name} vs ${game.awayTeam.name}`}
    >
      {isLive && (
        <View style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>
            {status === 'HT' ? 'HT' : live?.minute != null ? `${live.minute}'` : 'LIVE'}
          </Text>
        </View>
      )}

      <View style={styles.row}>
        {/* Home team */}
        <View style={styles.teamBlock}>
          <Text style={styles.flag}>{game.homeTeam.flag ?? ''}</Text>
          <Text style={styles.teamCode} numberOfLines={1}>{game.homeTeam.code}</Text>
        </View>

        {/* Score / kickoff */}
        <View style={styles.centre}>
          {isFinished || isLive ? (
            <Text style={[styles.score, isLive && styles.scoreLive]}>
              {homeScore ?? 0} – {awayScore ?? 0}
            </Text>
          ) : (
            <Text style={styles.kickoff}>{formatKickoffTime(game.kickoff)}</Text>
          )}
          <Text style={styles.status}>
            {isFinished && !isLive ? (status === 'AET' ? 'AET' : status === 'PEN' ? 'PEN' : 'FT') : ''}
          </Text>
        </View>

        {/* Away team */}
        <View style={[styles.teamBlock, styles.teamBlockRight]}>
          <Text style={styles.flag}>{game.awayTeam.flag ?? ''}</Text>
          <Text style={styles.teamCode} numberOfLines={1}>{game.awayTeam.code}</Text>
        </View>
      </View>

      {game.group && (
        <Text style={styles.meta}>{game.group}{game.venue ? ` · ${game.venue}` : ''}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },
  liveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F55B00',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 8,
  },
  liveBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  row: { flexDirection: 'row', alignItems: 'center' },
  teamBlock: { flex: 1, alignItems: 'flex-start', gap: 4 },
  teamBlockRight: { alignItems: 'flex-end' },
  flag: { fontSize: 28 },
  teamCode: { fontSize: 13, fontWeight: '600', color: '#1a1a1a' },
  centre: { alignItems: 'center', minWidth: 64 },
  score: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  scoreLive: { color: '#F55B00' },
  kickoff: { fontSize: 18, fontWeight: '600', color: '#1a1a1a' },
  status: { fontSize: 11, color: '#888', marginTop: 2 },
  meta: { marginTop: 8, fontSize: 11, color: '#999', textAlign: 'center' },
});
