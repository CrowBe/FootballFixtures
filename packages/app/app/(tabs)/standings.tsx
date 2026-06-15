import { FlatList, View, Text, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useStandingsQuery } from '../../src/api/queries.js';
import { GroupTable } from '../../src/components/GroupTable.js';
import { COMPETITION_ID } from '../../src/constants.js';

export default function StandingsScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useStandingsQuery(COMPETITION_ID);

  if (isLoading) {
    return (
      <View style={styles.centre}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={styles.centre}>
        <Text style={styles.errorText}>Could not load standings. Check your connection.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={data.standings}
      keyExtractor={(item) => item.group}
      renderItem={({ item }) => <GroupTable standing={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      ListEmptyComponent={
        <View style={styles.centre}>
          <Text style={styles.emptyText}>No results yet — standings will appear once games kick off.</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32, paddingTop: 8 },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  errorText: { fontSize: 15, color: '#888', textAlign: 'center' },
  emptyText: { fontSize: 15, color: '#aaa', textAlign: 'center' },
});
