import { useWindowDimensions } from "react-native";

export const useItemHeight = () => {
  const { width } = useWindowDimensions();
  const isVeryWide = width >= 2800;
  const isWide = width >= 2200 && width < 2800;
  const isMedium = width >= 1600 && width < 2200;
  const itemHeight = isVeryWide ? 140 : isWide ? 128 : isMedium ? 118 : 110;
  return { itemHeight };
};
