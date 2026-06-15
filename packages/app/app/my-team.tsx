import {
  View,
  Text,
  StyleSheet,
  SectionList,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useScheduleQuery } from '../src/api/queries.js';
import { useMyTeams } from '../src/hooks/useMyTeams.js';
import { useRegisterMutation } from '../src/api/mutations.js';
import { COMPETITION_ID, PUSH_TOKEN_STORAGE_KEY } from '../src/constants.js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameTeamRef } from '@footballfixtures/shared';

const ORANGE = '#F55B00';

interface TeamSection {
  title: string;
  data: GameTeamRef[];
}

function extractTeamSections(games: { homeTeam: GameTeamRef; awayTeam: GameTeamRef; group?: string }[]): TeamSection[] {
  const groupMap = new Map<string, Map<string, GameTeamRef>>();

  for (const game of games) {
    for (const team of [game.homeTeam, game.awayTeam]) {
      if (team.id.startsWith('tbd-')) continue;
      const group = game.group ?? 'Other';
      if (!groupMap.has(group)) groupMap.set(group, new Map());
      groupMap.get(group)!.set(team.id, team);
    }
  }

  return [...groupMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, teamsMap]) => ({
      title: group,
      data: [...teamsMap.values()].sort((a, b) => a.name.localeCompare(b.name)),
    }));
}

export default function MyTeamScreen() {
  const { data, isLoading } = useScheduleQuery(COMPETITION_ID);
  const { teamIds, loaded, toggle } = useMyTeams();
  const { mutate: register } = useRegisterMutation();

  async function handleToggle(teamId: string) {
    const next = await toggle(teamId);
    const token = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);
    if (token) {
      register(
        { pushToken: token, teamIds: next },
        {
          onError: () =>
            Alert.alert('Sync failed', 'Could not update your notification preferences. Try again later.'),
        },
      );
    }
  }

  if (isLoading || !loaded) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" color={ORANGE} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.centre}>
        <Text style={styles.errorText}>Could not load teams. Check your connection.</Text>
      </View>
    );
  }

  const sections = extractTeamSections(data.games);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      renderSectionHeader={({ section }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
      )}
      renderItem={({ item }) => {
        const selected = teamIds.includes(item.id);
        return (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={() => handleToggle(item.id)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}
          >
            <Text style={styles.flag}>{item.flag ?? ''}</Text>
            <Text style={styles.teamName}>{item.name}</Text>
            <View style={[styles.check, selected && styles.checkSelected]}>
              {selected && <Text style={styles.checkMark}>✓</Text>}
            </View>
          </Pressable>
        );
      }}
      ListHeaderComponent={
        <Text style={styles.header}>
          Follow teams to receive goal and match event notifications.
        </Text>
      }
      contentContainerStyle={styles.list}
      stickySectionHeadersEnabled
    />
  );
}

const styles = StyleSheet.create({
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: 15, color: '#888', textAlign: 'center', padding: 32 },
  list: { paddingBottom: 40 },
  header: {
    fontSize: 14,
    color: '#666',
    padding: 16,
    paddingBottom: 8,
  },
  sectionHeader: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#555', textTransform: 'uppercase', letterSpacing: 0.5 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
    gap: 12,
  },
  rowPressed: { opacity: 0.7 },
  flag: { fontSize: 24, width: 32, textAlign: 'center' },
  teamName: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: ORANGE, borderColor: ORANGE },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
