# Multi-Language & RTL Support Implementation Guide

## Overview

This document describes the comprehensive multi-language support with Arabic language and Right-to-Left (RTL) layout handling implemented in the Tarteel TV application.

## Architecture

### Components

#### 1. **i18n Configuration** (`src/i18n/config.ts`)
- Initializes i18next with English and Arabic language support
- Automatically detects device language using `expo-localization`
- Provides helper functions for language management:
  - `getIsRTL()`: Returns true if current language is RTL (Arabic)
  - `toggleLanguage()`: Switches between English and Arabic
  - `setLanguage(lang)`: Sets specific language
  - `getLanguage()`: Gets current language code

#### 2. **Translation Files** (`src/i18n/locales/`)
- **en.json**: English translations for all UI strings
- **ar.json**: Arabic translations (Arabic text is fully translated)

Structure:
```json
{
  "app": { "title": "...", "subtitle": "..." },
  "navigation": { "home": "...", "player": "...", ... },
  "home": { ... },
  "surahs": { "1": "...", "2": "...", ... }
}
```

#### 3. **Language Context** (`src/context/LanguageContext.tsx`)
Provides React Context for:
- Managing global language state
- Providing `useLanguage()` hook for components
- Exposing language and RTL status to all components

#### 4. **RTL Utilities** (`src/utils/rtl.ts`)
Helper functions for RTL-aware styling:
- `getTextAlign()`: Returns 'right' (RTL) or 'left' (LTR)
- `getFlexDirection()`: Returns 'row-reverse' (RTL) or 'row' (LTR)
- `getHorizontalAlign()`: Returns 'flex-end' (RTL) or 'flex-start' (LTR)
- `getPositionStart/End()`: Returns left/right positioning for RTL
- `getRTLFlip()`: Returns -1 (RTL) or 1 (LTR) for transforms
- `getTextDirection()`: Returns 'rtl' or 'ltr' for accessibility

#### 5. **Language Switcher Component** (`src/components/language-switcher.tsx`)
- UI component to toggle between languages
- Integrated into HomeScreen
- Shows current language as button text
- Available in small, medium, and large sizes

#### 6. **Enhanced API Service** (`src/services/api.ts`)
- Multi-language support for API endpoints
- Automatically uses current language for API requests
- Proper Arabic text encoding/decoding
- Supports both English and Arabic Quran reciter data
- Language mapping: `en` ↔ `ar` for API parameters

### Integration Points

#### App.tsx
```tsx
<I18nextProvider i18n={i18n}>
  <LanguageProvider>
    <AppNavigator />
  </LanguageProvider>
</I18nextProvider>
```

#### HomeScreen.tsx Updates
- Uses `useTranslation()` hook for all UI strings
- Uses `useLanguage()` hook for RTL-aware styling
- RTL flex direction for layouts
- Language-aware API calls

## Usage

### Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return <Text>{t('home.title')}</Text>;
}
```

### Using RTL Support in Styles

```tsx
import { useLanguage } from '../context/LanguageContext';
import { getFlexDirection, getTextAlign } from '../utils/rtl';

export default function MyComponent() {
  const { isRTL } = useLanguage();
  
  const styles = StyleSheet.create({
    container: {
      flexDirection: getFlexDirection(), // 'row' or 'row-reverse'
      textAlign: getTextAlign(), // 'left' or 'right'
    }
  });
  
  return <View style={styles.container}>...</View>;
}
```

### Toggling Language

```tsx
import { useLanguage } from '../context/LanguageContext';

export default function LanguageButton() {
  const { toggleLanguage, language } = useLanguage();
  
  return (
    <Pressable onPress={toggleLanguage}>
      <Text>{language === 'ar' ? 'English' : 'العربية'}</Text>
    </Pressable>
  );
}
```

## Adding a New Language

### Step 1: Create Translation File
Create `src/i18n/locales/[lang-code].json`:
```json
{
  "app": { "title": "...", ... },
  "navigation": { ... },
  ...
}
```

### Step 2: Update i18n Config
In `src/i18n/config.ts`:
```tsx
import newLang from './locales/[lang-code].json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  '[lang-code]': { translation: newLang }, // Add here
};
```

### Step 3: Configure RTL (if needed)
Update `LanguageProvider` logic if the new language is RTL:
```tsx
const isRTL = ['ar', 'he', 'fa'].includes(i18n.language);
```

### Step 4: Update API Language Support
In `src/services/api.ts`, add to `languageMap`:
```tsx
const languageMap: { [key: string]: APILanguage } = {
  en: "en",
  ar: "ar",
  '[lang-code]': "[api-lang]", // Add here
};
```

## API Endpoint Support

### MP3Quran API
- **English**: `https://www.mp3quran.net/api/v3/reciters?language=en`
- **Arabic**: `https://www.mp3quran.net/api/v3/reciters?language=ar`

The API automatically responds with translated content based on the language parameter.

## RTL Layout Checklist

When implementing RTL support for new components:

- [ ] Use `getFlexDirection()` for row-based layouts
- [ ] Use `getTextAlign()` for text alignment
- [ ] Replace hardcoded `left`/`right` with `getPositionStart/End()`
- [ ] Replace `marginRight`/`marginLeft` with conditional values
- [ ] Add `direction: isRTL ? 'rtl' : 'ltr'` to container styles
- [ ] Test icon/image positioning
- [ ] Verify focus states in RTL mode
- [ ] Test with actual RTL content (Arabic text)

## Testing

### Running RTL Tests
```bash
npm test -- src/__tests__/rtl-support.test.ts
```

### Manual Testing Checklist
1. **Language Switching**
   - [ ] Toggle between English and Arabic
   - [ ] UI updates immediately
   - [ ] Text displays correctly
   - [ ] API calls use correct language

2. **RTL Layout**
   - [ ] Text is right-aligned in Arabic
   - [ ] Flex layouts reverse direction
   - [ ] Margins/padding adjust correctly
   - [ ] Icons maintain proper positioning
   - [ ] Focus states work in both directions

3. **Content**
   - [ ] Arabic text renders without encoding issues
   - [ ] Surah names display correctly
   - [ ] Reciter names in Arabic display properly
   - [ ] Search works in both languages

4. **Accessibility**
   - [ ] Screen readers announce text direction
   - [ ] Keyboard navigation respects direction
   - [ ] Focus order is logical

## Translation Keys Reference

### App Keys
- `app.title`: Application title
- `app.subtitle`: Application subtitle

### Navigation Keys
- `navigation.home`: Home screen
- `navigation.player`: Player screen
- `navigation.about`: About page
- `navigation.privacy`: Privacy page

### Home Screen Keys
- `home.title`: Title
- `home.search`: Search placeholder
- `home.loading`: Loading message
- `home.error`: Error message
- `home.retry`: Retry button
- `home.noResults`: No results message
- `home.filterBy`: Filter label
- `home.allRiwaya`: All filter option

### Riwaya Keys
- `riwaya.hafs`: Hafs an Asim
- `riwaya.warsh`: Warsh an Nafi
- `riwaya.qalun`: Qalun an Nafi
- `riwaya.alduri`: Alduri an Alkaissai

### Surah Keys
- `surahs.1` through `surahs.114`: All 114 Surah names in both English and Arabic

### Common Keys
- `common.about`: About
- `common.privacy`: Privacy
- `common.language`: Language
- `common.english`: English
- `common.arabic`: العربية
- `common.settings`: Settings
- `common.close`: Close

## Performance Considerations

1. **Language Detection**: Done at app startup, minimal impact
2. **Translation Files**: Bundled at build time, no runtime download
3. **RTL Calculations**: Cached in component state, minimal re-renders
4. **API Calls**: Single language parameter change, no additional overhead

## Browser/Platform Support

### React Native (Expo)
- ✅ Fully supported for RTL
- ✅ Arabic font rendering supported
- ✅ RTL navigation supported with `react-tv-space-navigation`

### Supported Languages
- ✅ English (en) - LTR
- ✅ Arabic (ar) - RTL
- 🔄 Additional languages can be added following the guide above

## Troubleshooting

### Issue: Arabic text not displaying correctly
**Solution**: Ensure the font supports Arabic characters. The app uses system fonts which support Arabic on both iOS and Android.

### Issue: RTL layout not applying
**Solution**: Verify you're using RTL helper functions and not hardcoded left/right values.

### Issue: Language not persisting
**Solution**: Implement localStorage/AsyncStorage in `LanguageProvider` to save preference (optional enhancement).

### Issue: API returning English when expecting Arabic
**Solution**: Check that `getAPILanguage()` returns 'ar' and the API request includes `language=ar` parameter.

## Future Enhancements

1. **Language Persistence**: Save user's language preference to device storage
2. **Additional Languages**: Implement support for French, Turkish, Urdu, etc.
3. **Pluralization**: Add i18next pluralization support for message variations
4. **Formatting**: Add date/number formatting based on locale
5. **Right-to-Left Animations**: Customize animations for RTL flow direction
6. **Accessibility**: Enhanced screen reader support for bidirectional text

## References

- [i18next Documentation](https://www.i18next.com/)
- [React-i18next Documentation](https://react.i18next.com/)
- [Expo Localization](https://docs.expo.dev/versions/latest/sdk/localization/)
- [RTL Best Practices](https://material.io/blog/bidi-support-for-flutter)
- [MP3Quran API Documentation](https://www.mp3quran.net/api/v3/)
