import { View, Text, StyleSheet } from 'react-native';
import type { GroupStanding } from '@footballfixtures/shared';

interface Props {
  standing: GroupStanding;
}

export function GroupTable({ standing }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.groupName}>{standing.group}</Text>

      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.col, styles.posCol]} />
        <Text style={[styles.col, styles.teamCol, styles.headerText]}>Team</Text>
        <Text style={[styles.col, styles.statCol, styles.headerText]}>P</Text>
        <Text style={[styles.col, styles.statCol, styles.headerText]}>W</Text>
        <Text style={[styles.col, styles.statCol, styles.headerText]}>D</Text>
        <Text style={[styles.col, styles.statCol, styles.headerText]}>L</Text>
        <Text style={[styles.col, styles.statCol, styles.headerText]}>GD</Text>
        <Text style={[styles.col, styles.ptsCol, styles.headerText]}>Pts</Text>
      </View>

      {standing.entries.map((entry, idx) => (
        <View
          key={entry.team.id}
          style={[styles.row, idx % 2 === 0 && styles.rowAlt]}
        >
          <Text style={[styles.col, styles.posCol, styles.posText]}>{entry.position}</Text>
          <View style={[styles.col, styles.teamCol, styles.teamInner]}>
            <Text style={styles.flag}>{entry.team.flag ?? ''}</Text>
            <Text style={styles.teamName} numberOfLines={1}>{entry.team.name}</Text>
          </View>
          <Text style={[styles.col, styles.statCol, styles.statText]}>{entry.played}</Text>
          <Text style={[styles.col, styles.statCol, styles.statText]}>{entry.won}</Text>
          <Text style={[styles.col, styles.statCol, styles.statText]}>{entry.drawn}</Text>
          <Text style={[styles.col, styles.statCol, styles.statText]}>{entry.lost}</Text>
          <Text style={[styles.col, styles.statCol, styles.statText]}>
            {entry.goalDifference > 0 ? `+${entry.goalDifference}` : entry.goalDifference}
          </Text>
          <Text style={[styles.col, styles.ptsCol, styles.ptsText]}>{entry.points}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  groupName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fafafa',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  rowAlt: { backgroundColor: '#fafafa' },
  headerText: { fontSize: 10, fontWeight: '600', color: '#999', textAlign: 'center' },
  col: { justifyContent: 'center' },
  posCol: { width: 24 },
  teamCol: { flex: 1 },
  statCol: { width: 28, textAlign: 'center' },
  ptsCol: { width: 32, textAlign: 'center' },
  posText: { fontSize: 12, color: '#999', textAlign: 'center' },
  teamInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  flag: { fontSize: 16 },
  teamName: { fontSize: 13, color: '#1a1a1a', flex: 1 },
  statText: { fontSize: 12, color: '#555', textAlign: 'center' },
  ptsText: { fontSize: 13, fontWeight: '700', color: '#1a1a1a', textAlign: 'center' },
});
