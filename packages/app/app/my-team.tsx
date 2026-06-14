import { View, Text, StyleSheet } from 'react-native';

// Milestone 4: replace with team picker backed by local AsyncStorage.
export default function MyTeamScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>My Team — coming in Milestone 4</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 16, opacity: 0.5 },
});
