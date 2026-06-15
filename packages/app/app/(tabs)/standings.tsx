import { FlatList, View, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useStandingsQuery } from '../../src/api/queries.js';
import { GroupTable } from '../../src/components/GroupTable.js';
import { EmptyState } from '../../src/components/EmptyState.js';
import { COMPETITION_ID } from '../../src/constants.js';
import { palette } from '../../src/theme/tokens.js';

export default function StandingsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useStandingsQuery(COMPETITION_ID);

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
        message="Could not load standings. Check your internet connection and pull down to retry."
        actionLabel="Retry"
        onAction={refetch}
      />
    );
  }

  return (
    <FlatList
      data={data?.standings ?? []}
      keyExtractor={(item) => item.group}
      renderItem={({ item }) => <GroupTable standing={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={palette.orange}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="⚽"
          title="No results yet"
          message="Standings will appear once the group stage gets underway."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32, paddingTop: 8 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
});
