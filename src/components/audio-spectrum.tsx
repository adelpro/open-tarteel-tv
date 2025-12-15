import React, { memo, useEffect, useRef } from "react";
import { Animated, Easing, View } from "react-native";

type AudioSpectrumStyles = {
  spectrumRow: any;
  spectrumBar: any;
};

type AudioSpectrumProps = {
  playing: boolean;
  styles: AudioSpectrumStyles;
};

const AudioSpectrum = ({ playing, styles }: AudioSpectrumProps) => {
  const bars = 14;
  const valuesRef = useRef<Animated.Value[]>(
    Array.from({ length: bars }, () => new Animated.Value(0.6))
  );
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    loopsRef.current.forEach((loop) => loop.stop());
    loopsRef.current = [];

    if (!playing) {
      return;
    }

    valuesRef.current.forEach((value, index) => {
      const up = Animated.timing(value, {
        toValue: 1,
        duration: 300 + index * 20,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      const down = Animated.timing(value, {
        toValue: 0.4,
        duration: 300 + index * 20,
        easing: Easing.linear,
        useNativeDriver: true,
      });

      const loop = Animated.loop(Animated.sequence([up, down]));
      loopsRef.current.push(loop);
      loop.start();
    });

    return () => {
      loopsRef.current.forEach((loop) => loop.stop());
      loopsRef.current = [];
    };
  }, [playing]);

  return (
    <View style={styles.spectrumRow}>
      {valuesRef.current.map((value, index) => (
        <Animated.View
          key={`bar-${index}`}
          style={[
            styles.spectrumBar,
            {
              transform: [{ scaleY: value }],
            },
          ]}
        />
      ))}
    </View>
  );
};

export default memo(AudioSpectrum);
