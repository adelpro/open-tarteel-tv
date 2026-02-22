//Must be the first import
import i18n from "./src/i18n";

import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import AppNavigator from "./src/navigation/app-navigator";
import { I18nextProvider } from "react-i18next";
import { FavoritesProvider } from "./src/context/favorites.context";
import { SettingsProvider } from "./src/context/settings.context";

// Instruct SplashScreen not to hide yet, we want to do this manually
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some race conditions, ignore them */
});

// Add fade animation to splash screen
SplashScreen.setOptions({ fade: true, duration: 1000 });

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // The fake delay (setTimeout) has been removed to speed up the app launch
      } catch {
      } finally {
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <I18nextProvider i18n={i18n}>
      <FavoritesProvider>
        <SettingsProvider>
          <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
            <StatusBar style="light" />
            <AppNavigator />
          </View>
        </SettingsProvider>
      </FavoritesProvider>
    </I18nextProvider>
  );
}
