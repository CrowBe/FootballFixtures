import { View, Text, StyleSheet } from 'react-native';

// Milestone 4/5: replace with notification toggles and preferences.
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Settings — coming in Milestone 4/5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { fontSize: 16, opacity: 0.5 },
});
