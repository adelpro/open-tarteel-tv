export const GUN_PEERS = "https://gundb-relay.quran.us.kg/gun";

export const GUNCONFIG = {
  peers: [GUN_PEERS],
  localStorage: false,
  radisk: false,
};

const ENV_PREFIX = __DEV__ ? "dev" : "prod";
const APP_PREFIX = "open-tarteel";

export const FAVORITE_COUNTS_KEY = `${APP_PREFIX}-${ENV_PREFIX}-favorite-counts`;
export const VIEW_COUNTS_KEY = `${APP_PREFIX}-${ENV_PREFIX}-view-counts`;
