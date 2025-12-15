import React, { memo, useState } from "react";
import { TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";

type SearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  onFocusChange?: (focused: boolean) => void;
  styles: {
    searchInputContainer: any;
    searchInputFocused: any;
    searchInput: any;
    searchInputIcon: any;
  };
  isDark: boolean;
};

const SearchInput = ({
  value,
  onChangeText,
  onFocusChange,
  styles,
  isDark,
}: SearchInputProps) => {
  const [textFocused, setTextFocused] = useState(false);

  return (
    <SpatialNavigationFocusableView onSelect={() => {}}>
      {({ isFocused }) => (
        <View
          style={[
            styles.searchInputContainer,
            (textFocused || isFocused) && styles.searchInputFocused,
          ]}
        >
          <TextInput
            style={styles.searchInput}
            value={value}
            onChangeText={onChangeText}
            onFocus={() => {
              setTextFocused(true);
              onFocusChange?.(true);
            }}
            onBlur={() => {
              setTextFocused(false);
              onFocusChange?.(false);
            }}
            placeholder="Search reciters..."
            placeholderTextColor={isDark ? "#888" : "#999"}
          />
          <Ionicons
            name="search"
            size={20}
            color={
              textFocused || isFocused
                ? "#4CAF50"
                : isDark
                ? "#888"
                : "#999"
            }
            style={styles.searchInputIcon}
          />
        </View>
      )}
    </SpatialNavigationFocusableView>
  );
};

export default memo(SearchInput);

