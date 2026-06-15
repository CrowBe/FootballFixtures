import { Tabs } from 'expo-router';
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

const ORANGE = '#F55B00';

export default function TabsLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ORANGE,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              style={{ marginRight: 16 }}
              accessibilityLabel="Settings"
            >
              <Text style={{ fontSize: 22 }}>⚙️</Text>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="standings"
        options={{
          title: 'Standings',
          tabBarLabel: 'Standings',
        }}
      />
    </Tabs>
  );
}
