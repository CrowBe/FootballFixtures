import { View, Text, StyleSheet } from 'react-native';

// Milestone 2: replace with real schedule list backed by TanStack Query.
export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Schedule — coming in Milestone 2</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 16, opacity: 0.5 },
});
