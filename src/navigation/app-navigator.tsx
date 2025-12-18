import {
  NavigationContainer,
  createNavigationContainerRef,
  LinkingOptions,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  SpatialNavigationRoot,
  SpatialNavigation,
} from "react-tv-space-navigation";
import { useTVEventHandler, useColorScheme } from "react-native";
import { useTranslation } from "react-i18next";

import HomeScreen from "../screens/home-acreen";
import PlayerScreen from "../screens/player-screen";
import AboutScreen from "../screens/about-screen";
import PrivacyScreen from "../screens/privacy-screen";

const Stack = createNativeStackNavigator();

const navigationRef = createNavigationContainerRef();

type TVKey =
  | "left"
  | "right"
  | "up"
  | "down"
  | "enter"
  | "long_enter"
  | "*"
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
  prefixes: ["opentarteel://"],
  config: {
    screens: {
      Home: "home",
      Search: {
        path: "search/:q?/:riwaya?",
        parse: {
          q: (s: string) => s || "",
          riwaya: (s: string) => s || undefined,
        },
      },
      Player: {
        path: "player/:reciterId?/:surahId?",
        parse: {
          reciterId: (id: string) => (id ? Number(id) : undefined),
          surahId: (id: string) => (id ? Number(id) : undefined),
        },
      },
      About: "about",
      Privacy: "privacy",
    },
  },
};

export default function AppNavigator() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== "light";
  useTVEventHandler((evt: any) => {
    const type = evt?.eventType as string | undefined;
    const cb = onTvEvent;
    if (!cb || !type) return;
    switch (type) {
      case "up":
        cb("up");
        break;
      case "down":
        cb("down");
        break;
      case "left":
        cb("left");
        break;
      case "right":
        cb("right");
        break;
      case "select":
      case "playPause":
      case "enter":
        cb("enter");
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
            headerStyle: { backgroundColor: isDark ? "#000" : "#fff" },
            headerTintColor: isDark ? "#fff" : "#111",
            headerTitleStyle: { fontWeight: "bold" },
            gestureEnabled: false,
            animation: "fade",
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: t("app_name") }}
          />
          <Stack.Screen
            name="Search"
            component={HomeScreen}
            options={{ title: t("search_title") }}
          />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ title: t("quran_player") }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: t("about.about_title") }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ title: t("privacy.title") }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SpatialNavigationRoot>
  );
}
