import {
  SectionList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useScheduleQuery, useLiveQuery } from '../../src/api/queries.js';
import { GameCard } from '../../src/components/GameCard.js';
import { EmptyState } from '../../src/components/EmptyState.js';
import { COMPETITION_ID } from '../../src/constants.js';
import { localDateKey, formatKickoffDate } from '../../src/utils/time.js';
import { palette } from '../../src/theme/tokens.js';
import type { Game, LiveGameState } from '@footballfixtures/shared';

interface Section {
  title: string;
  dateKey: string;
  data: Game[];
}

function groupByDate(games: Game[]): Section[] {
  const map = new Map<string, Game[]>();
  for (const game of [...games].sort(
    (a, b) => Date.parse(a.kickoff) - Date.parse(b.kickoff),
  )) {
    const key = localDateKey(game.kickoff);
    const list = map.get(key) ?? [];
    list.push(game);
    map.set(key, list);
  }
  return [...map.entries()].map(([dateKey, data]) => ({
    dateKey,
    title: formatKickoffDate(data[0]!.kickoff),
    data,
  }));
}

export default function ScheduleScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useScheduleQuery(COMPETITION_ID);
  const { data: liveData } = useLiveQuery(COMPETITION_ID);

  const liveMap = new Map<string, LiveGameState>(
    (liveData?.games ?? []).map((g) => [g.gameId, g]),
  );

  if (isLoading) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={palette.orange} />
      </View>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon="📡"
        title="No connection"
        message="Could not load the schedule. Check your internet connection and pull down to retry."
        actionLabel="Retry"
        onAction={refetch}
      />
    );
  }

  const sections = groupByDate(data?.games ?? []);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <GameCard game={item} live={liveMap.get(item.id)} />}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={palette.orange}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="🗓️"
          title="No games scheduled"
          message="Check back soon — the fixture list will appear here."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#555' },
});
