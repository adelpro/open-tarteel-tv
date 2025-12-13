import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { Reciter } from "../types";
import { getAllReciters } from "../services/api";

export default function HomeScreen() {
  const [reciters, setReciters] = useState<Reciter[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<any>();

  useEffect(() => {
    loadReciters();
  }, []);

  const loadReciters = async () => {
    setLoading(true);
    const data = await getAllReciters();
    setReciters(data);
    setLoading(false);
  };

  const handleReciterPress = (reciter: Reciter) => {
    navigation.navigate("Player", { reciter });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading Reciters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a Reciter</Text>
      <FlatList
        data={reciters}
        keyExtractor={(item, index) => `${item.id}-${item.moshaf.id}-${index}`}
        numColumns={4}
        renderItem={({ item }) => (
          <SpatialNavigationFocusableView>
            {({ isFocused }) => (
              <Pressable
                style={[
                  styles.reciterCard,
                  isFocused && styles.reciterCardFocused,
                ]}
                onPress={() => handleReciterPress(item)}
              >
                <Text style={styles.reciterName}>{item.name}</Text>
                <Text style={styles.reciterMoshaf}>{item.moshaf.name}</Text>
              </Pressable>
            )}
          </SpatialNavigationFocusableView>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  loadingText: {
    color: "#fff",
    marginTop: 10,
    fontSize: 16,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  reciterCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    margin: 10,
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#333",
  },
  reciterCardFocused: {
    backgroundColor: "#2E7D32",
    borderColor: "#4CAF50",
    transform: [{ scale: 1.05 }],
  },
  reciterName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  reciterMoshaf: {
    fontSize: 14,
    color: "#AAA",
  },
});
