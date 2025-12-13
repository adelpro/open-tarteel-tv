import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, Pressable } from "react-native";
import { useRoute } from "@react-navigation/native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { SURAHS } from "../constants/surahs";
import { Reciter } from "../types";

export default function PlayerScreen() {
  const route = useRoute<any>();
  const reciter: Reciter = route.params?.reciter;
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);

  if (!reciter) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>No reciter selected</Text>
      </View>
    );
  }

  const handleSurahPress = (surahId: number) => {
    setSelectedSurah(surahId);
    // TODO: Integrate react-native-track-player here
    const audioUrl = reciter.moshaf.playlist.find(
      (item) => parseInt(item.surahId) === surahId
    )?.link;
    console.log("Playing:", audioUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.reciterName}>{reciter.name}</Text>
        <Text style={styles.moshafName}>{reciter.moshaf.name}</Text>
      </View>

      <FlatList
        data={SURAHS}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        renderItem={({ item }) => {
          const isSelected = selectedSurah === item.id;
          return (
            <SpatialNavigationFocusableView>
              {({ isFocused }) => (
                <Pressable
                  style={[
                    styles.surahCard,
                    isFocused && styles.surahCardFocused,
                    isSelected && styles.surahCardSelected,
                  ]}
                  onPress={() => handleSurahPress(item.id)}
                >
                  <Text style={styles.surahNumber}>{item.id}</Text>
                  <Text style={styles.surahName}>{item.name}</Text>
                  <Text style={styles.surahEnglishName}>
                    {item.englishName}
                  </Text>
                </Pressable>
              )}
            </SpatialNavigationFocusableView>
          );
        }}
      />

      {selectedSurah && (
        <View style={styles.playerControls}>
          <Text style={styles.nowPlaying}>
            Now Playing:{" "}
            {SURAHS.find((s) => s.id === selectedSurah)?.englishName}
          </Text>
          {/* TODO: Add play/pause/next/prev controls */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
  },
  header: {
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderBottomWidth: 2,
    borderBottomColor: "#4CAF50",
  },
  reciterName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  moshafName: {
    fontSize: 16,
    color: "#AAA",
    marginTop: 5,
  },
  surahCard: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    margin: 8,
    padding: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#333",
    minWidth: 150,
  },
  surahCardFocused: {
    backgroundColor: "#2E7D32",
    borderColor: "#4CAF50",
    transform: [{ scale: 1.05 }],
  },
  surahCardSelected: {
    backgroundColor: "#1976D2",
    borderColor: "#2196F3",
  },
  surahNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 5,
  },
  surahName: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 3,
  },
  surahEnglishName: {
    fontSize: 12,
    color: "#AAA",
  },
  playerControls: {
    padding: 20,
    backgroundColor: "#1E1E1E",
    borderTopWidth: 2,
    borderTopColor: "#4CAF50",
  },
  nowPlaying: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
  },
});
