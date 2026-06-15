import { View, Text, StyleSheet, Pressable, Linking, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';

const ORANGE = '#F55B00';

type PermStatus = 'granted' | 'denied' | 'undetermined' | 'checking';

export default function SettingsScreen() {
  const router = useRouter();
  const [permStatus, setPermStatus] = useState<PermStatus>('checking');

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => {
      setPermStatus(status as PermStatus);
    });
  }, []);

  async function requestPermissions() {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermStatus(status as PermStatus);
    if (status !== 'granted') {
      Alert.alert(
        'Notifications blocked',
        'Open your device settings to allow notifications for FootballFixtures.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ],
      );
    }
  }

  const permLabel =
    permStatus === 'checking'
      ? 'Checking…'
      : permStatus === 'granted'
      ? 'Enabled'
      : permStatus === 'denied'
      ? 'Blocked — tap to open Settings'
      : 'Not enabled — tap to allow';

  const permGranted = permStatus === 'granted';

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Notifications</Text>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={permGranted ? undefined : requestPermissions}
        disabled={permGranted}
      >
        <Text style={styles.rowLabel}>Push notifications</Text>
        <Text style={[styles.rowValue, permGranted ? styles.valueGranted : styles.valueDenied]}>
          {permLabel}
        </Text>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => router.push('/my-team')}
      >
        <Text style={styles.rowLabel}>My followed teams</Text>
        <Text style={styles.rowChevron}>›</Text>
      </Pressable>

      <Text style={styles.hint}>
        You'll receive goal alerts and match updates for teams you follow.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowPressed: { opacity: 0.7 },
  rowLabel: { flex: 1, fontSize: 15, color: '#1a1a1a' },
  rowValue: { fontSize: 14 },
  valueGranted: { color: '#34C759' },
  valueDenied: { color: ORANGE },
  rowChevron: { fontSize: 20, color: '#ccc' },
  hint: {
    fontSize: 13,
    color: '#999',
    padding: 16,
    paddingTop: 12,
    lineHeight: 18,
  },
});
