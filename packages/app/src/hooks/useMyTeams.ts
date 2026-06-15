import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MY_TEAMS_STORAGE_KEY } from '../constants.js';

export function useMyTeams() {
  const [teamIds, setTeamIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(MY_TEAMS_STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setTeamIds(JSON.parse(raw));
        } catch {}
      }
      setLoaded(true);
    });
  }, []);

  const save = useCallback(async (ids: string[]) => {
    setTeamIds(ids);
    await AsyncStorage.setItem(MY_TEAMS_STORAGE_KEY, JSON.stringify(ids));
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      const next = teamIds.includes(id)
        ? teamIds.filter((x) => x !== id)
        : [...teamIds, id];
      setTeamIds(next);
      await AsyncStorage.setItem(MY_TEAMS_STORAGE_KEY, JSON.stringify(next));
      return next;
    },
    [teamIds],
  );

  return { teamIds, loaded, save, toggle };
}
