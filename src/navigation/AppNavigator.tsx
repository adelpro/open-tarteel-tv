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

import HomeScreen from "../screens/HomeScreen";
import PlayerScreen from "../screens/PlayerScreen";
import AboutScreen from "../screens/AboutScreen";
import PrivacyScreen from "../screens/PrivacyScreen";

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
            options={{ title: "Open Tarteel TV" }}
          />
          <Stack.Screen
            name="Search"
            component={HomeScreen}
            options={{ title: "Search" }}
          />
          <Stack.Screen
            name="Player"
            component={PlayerScreen}
            options={{ title: "Quran Player" }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{ title: "About" }}
          />
          <Stack.Screen
            name="Privacy"
            component={PrivacyScreen}
            options={{ title: "Privacy Policy" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SpatialNavigationRoot>
  );
}
