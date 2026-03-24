import React from 'react';
import { StyleSheet } from 'react-native';

import { useTranslation } from 'react-i18next';
import { SpatialNavigationView } from 'react-tv-space-navigation';

import FilterChip from './filter-chip';

type SectionLetterFilterProps = {
  letters: string[];
  selectedLetter: string | null;
  onSelectLetter: (letter: string | null) => void;
  isRTL: boolean;
};

const SectionLetterFilter = ({
  letters,
  selectedLetter,
  onSelectLetter,
  isRTL,
}: SectionLetterFilterProps) => {
  const { t } = useTranslation();

  const styles = StyleSheet.create({
    row: {
      flexDirection: 'row',
      direction: isRTL ? 'rtl' : 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-start',
      flexWrap: 'wrap',
      marginVertical: 4,
    },
  });

  return (
    <SpatialNavigationView direction="horizontal" style={styles.row}>
      <FilterChip
        key="__all__"
        label={t('filter_all')}
        selected={selectedLetter === null}
        onPress={() => onSelectLetter(null)}
      />
      {letters.map((letter) => (
        <FilterChip
          key={letter}
          label={letter}
          selected={selectedLetter === letter}
          onPress={() =>
            onSelectLetter(selectedLetter === letter ? null : letter)
          }
        />
      ))}
    </SpatialNavigationView>
  );
};

export default SectionLetterFilter;
