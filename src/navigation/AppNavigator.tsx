import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SpatialNavigationRoot } from "react-tv-space-navigation";

import HomeScreen from "../screens/HomeScreen";
import PlayerScreen from "../screens/PlayerScreen";
import AboutScreen from "../screens/AboutScreen";
import PrivacyScreen from "../screens/PrivacyScreen";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <SpatialNavigationRoot>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: "#000",
            },
            headerTintColor: "#fff",
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        >
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{ title: "Open Tarteel TV" }}
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
