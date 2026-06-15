import { useMutation } from '@tanstack/react-query';
import type { RegisterRequest, RegisterResponse } from '@footballfixtures/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SERVER_URL, COMPETITION_ID, PUSH_TOKEN_STORAGE_KEY } from '../constants.js';

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async ({ pushToken, teamIds }: { pushToken: string; teamIds: string[] }) => {
      const body: RegisterRequest = { pushToken, teamIds, competitionId: COMPETITION_ID };
      const res = await fetch(`${SERVER_URL}/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`POST /register → ${res.status}`);
      return res.json() as Promise<RegisterResponse>;
    },
    onSuccess: (_data, { pushToken }) => {
      AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, pushToken);
    },
  });
}
