import { useColorScheme, useTVEventHandler } from 'react-native';

import {
  createNavigationContainerRef,
  LinkingOptions,
  NavigationContainer,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import {
  SpatialNavigation,
  SpatialNavigationRoot,
} from 'react-tv-space-navigation';

import AboutScreen from '../screens/about-screen';
import HomeScreen from '../screens/home-screen';
import PlayerScreen from '../screens/player-screen';
import PrivacyScreen from '../screens/privacy-screen';
import SettingsScreen from '../screens/settings-screen';

const Stack = createNativeStackNavigator();

const navigationRef = createNavigationContainerRef();

type TVKey =
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'enter'
  | 'long_enter'
  | '*'
  | null;
let onTvEvent: ((key: TVKey) => void) | null = null;

SpatialNavigation.configureRemoteControl({
  remoteControlSubscriber: (callback) => {
    onTvEvent = callback;
    return {
      remove: () => {
        onTvEvent = null;
      },
    };
  },
  remoteControlUnsubscriber: (subscriber) => {
    subscriber.remove();
  },
});

const linking: LinkingOptions<any> = {
  prefixes: ['opentarteel://'],
  config: {
    screens: {
      Home: 'home',
      Search: {
        path: 'search/:q?/:riwaya?',
        parse: {
          q: (s: string) => s || '',
          riwaya: (s: string) => s || undefined,
        },
      },
      Player: {
        path: 'player/:reciterId?/:surahId?',
        parse: {
          reciterId: (id: string) => (id ? Number(id) : undefined),
          surahId: (id: string) => (id ? Number(id) : undefined),
        },
      },
      About: 'about',
      Privacy: 'privacy',
      Settings: 'settings',
    },
  },
};

export default function AppNavigator() {
  const { t, i18n } = useTranslation();

  const isRTL = i18n.language === 'ar';
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  useTVEventHandler((evt: any) => {
    const type = evt?.eventType as string | undefined;
    const cb = onTvEvent;
    if (!cb || !type) return;
    switch (type) {
      case 'up':
        cb('up');
        break;
      case 'down':
        cb('down');
        break;
      case 'left':
        isRTL ? cb('right') : cb('left');
        break;
      case 'right':
        isRTL ? cb('left') : cb('right');
        break;
      case 'select':
      case 'playPause':
      case 'enter':
        cb('enter');
        break;
      default:
        break;
    }
  });

  return (
    <SpatialNavigationRoot>
      <NavigationContainer ref={navigationRef} linking={linking}>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: isDark ? '#000' : '#fff' },
            headerTintColor: isDark ? '#fff' : '#111',
            headerTitleStyle: { fontWeight: 'bold' },
            gestureEnabled: false,
            animation: 'fade',
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: t('app_name') }}
          />
          <Stack.Screen
            name="Search"
            component={HomeScreen}
            options={{ title: t('search_title') }}
          />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ title: t('quran_player') }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: t('about.about_title') }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ title: t('privacy.title') }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ title: t('settings') }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SpatialNavigationRoot>
  );
}
