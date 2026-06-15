export const APP_NAME = 'FootballFixtures';

/** Server base URL. Set EXPO_PUBLIC_SERVER_URL in your environment for non-local builds. */
export const SERVER_URL = (
  process.env['EXPO_PUBLIC_SERVER_URL'] ?? 'http://localhost:3000'
).replace(/\/+$/, '');

export const COMPETITION_ID = 'world-cup-2026';

/** AsyncStorage key for the user's followed team IDs. */
export const MY_TEAMS_STORAGE_KEY = 'ff:my-teams';

/** AsyncStorage key for the registered push token. */
export const PUSH_TOKEN_STORAGE_KEY = 'ff:push-token';
