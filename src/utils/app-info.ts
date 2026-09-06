import Constants from 'expo-constants';

export const getClientName = (): string =>
  Constants.expoConfig?.slug ?? 'open-tarteel-tv';

export const getAppVersion = (): string =>
  Constants.expoConfig?.version ?? '0.0.0';
