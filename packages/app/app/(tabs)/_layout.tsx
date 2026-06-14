import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Schedule',
          tabBarLabel: 'Schedule',
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
