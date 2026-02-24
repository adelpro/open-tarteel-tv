import React, { memo } from 'react';
import { Text, View } from 'react-native';

import { LinkSource } from '../types';

type SourceTagProps = {
  source: LinkSource;
};

type SourceTagConfig = {
  label: string;
  backgroundColor: string;
};

const SourceTag = ({ source }: SourceTagProps) => {
  const SOURCE_TAG: Record<LinkSource, SourceTagConfig> = {
    [LinkSource.MP3QURAN]: {
      label: LinkSource.MP3QURAN,
      backgroundColor: '#37474F',
    },
    [LinkSource.ITQAN]: {
      label: LinkSource.ITQAN,
      backgroundColor: '#004D40',
    },
  };

  const { label, backgroundColor } = SOURCE_TAG[source];

  return (
    <View
      style={{
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        height: 20,
        backgroundColor,
      }}
      accessibilityRole="text"
      accessibilityLabel={`Source ${label}`}
    >
      <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>
        {label}
      </Text>
    </View>
  );
};

export default memo(SourceTag);
