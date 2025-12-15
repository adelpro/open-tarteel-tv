# Multi-Language Implementation - Quick Start Guide

## 📱 What Was Implemented

A complete multi-language and RTL (Right-to-Left) support system for the Tarteel TV application with:

- **Full English & Arabic Support** ✅
- **Automatic Language Detection** ✅
- **RTL Layout Flipping** ✅
- **Bilingual API Integration** ✅
- **Language Switcher UI** ✅
- **Comprehensive Documentation** ✅

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
# or
pnpm install
```

The necessary packages have been added to `package.json`:
- `i18next`: ^23.7.6
- `react-i18next`: ^14.1.0
- `expo-localization`: ^15.2.0

### 2. The App is Ready to Use

The app automatically:
- ✅ Detects device language (English or Arabic)
- ✅ Loads appropriate translations
- ✅ Applies RTL layout if language is Arabic
- ✅ Fetches content in the current language

### 3. Toggle Language

Look for the **Language Switcher** button in the top menu of HomeScreen. Click it to toggle between English and العربية.

## 📁 File Structure

```
src/
├── i18n/
│   ├── config.ts                 # i18next configuration
│   └── locales/
│       ├── en.json               # English translations
│       └── ar.json               # Arabic translations
├── context/
│   └── LanguageContext.tsx       # Language state management
├── utils/
│   └── rtl.ts                    # RTL helper functions
├── components/
│   └── language-switcher.tsx     # Language toggle component
├── services/
│   └── api.ts                    # Enhanced with multi-language support
├── screens/
│   └── HomeScreen.tsx            # Updated with translations & RTL
└── __tests__/
    └── rtl-support.test.ts       # Comprehensive test suite
```

## 🌐 Using Translations in Your Components

### Example 1: Basic Translation
```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation();
  
  return <Text>{t('home.title')}</Text>;  // "Choose a Reciter" or "اختر القارئ"
}
```

### Example 2: RTL-Aware Layout
```tsx
import { useLanguage } from '../context/LanguageContext';
import { getFlexDirection, getTextAlign } from '../utils/rtl';

export default function MyLayout() {
  const { isRTL } = useLanguage();
  
  return (
    <View style={{
      flexDirection: getFlexDirection(),  // 'row' or 'row-reverse'
      textAlign: getTextAlign(),          // 'left' or 'right'
    }}>
      <Text>Content</Text>
    </View>
  );
}
```

### Example 3: Language Switcher
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

## 🔧 Adding a New Language

### Step 1: Create Translation File
Create `src/i18n/locales/[lang-code].json` with all keys from `en.json`:

```json
{
  "app": {
    "title": "Your App Title in New Language",
    "subtitle": "Your subtitle in new language"
  },
  "navigation": {
    "home": "Home in new language",
    ...
  }
  // ... all other keys
}
```

### Step 2: Update i18n Configuration
Edit `src/i18n/config.ts`:

```tsx
import newLang from './locales/[lang-code].json';

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  '[lang-code]': { translation: newLang },  // ← Add this
};
```

### Step 3: Update RTL Detection (if RTL language)
In `src/context/LanguageContext.tsx`, update RTL detection:

```tsx
// Add RTL languages to this array
const isRTLLanguage = ['ar', 'he', 'fa', 'ur'].includes(i18n.language);
setIsRTL(isRTLLanguage);
```

### Step 4: Test Your Language
Switch to the new language using the Language Switcher and verify all text displays correctly.

## 📊 Translation Keys Available

All translation keys are organized by feature:

```
app.*           - App title and branding
navigation.*    - Screen navigation labels
home.*          - Home screen specific labels
player.*        - Player screen labels
riwaya.*        - Quran recitation styles
surahs.*        - All 114 Surah names (1-114)
common.*        - Shared labels (About, Privacy, Language, etc.)
```

See `src/i18n/locales/en.json` for complete key list.

## 🎨 RTL Layout Helper Functions

Use these functions in your styles for RTL-aware layouts:

| Function | RTL Value | LTR Value | Use Case |
|----------|-----------|-----------|----------|
| `getTextAlign()` | 'right' | 'left' | Text alignment |
| `getFlexDirection()` | 'row-reverse' | 'row' | Flex layout |
| `getHorizontalAlign()` | 'flex-end' | 'flex-start' | Horizontal alignment |
| `getOppositeHorizontalAlign()` | 'flex-start' | 'flex-end' | Opposite alignment |
| `getPositionStart(n)` | {right: n} | {left: n} | Position from start |
| `getPositionEnd(n)` | {left: n} | {right: n} | Position from end |
| `getRTLFlip()` | -1 | 1 | Scale transform |

## 🔍 API Language Support

The app automatically uses the current language for API calls:

```typescript
// English endpoint (automatic)
// https://www.mp3quran.net/api/v3/reciters?language=en

// Arabic endpoint (automatic)
// https://www.mp3quran.net/api/v3/reciters?language=ar
```

No manual API URL switching needed - it's all automatic!

## 🧪 Testing Your Implementation

### Run Tests
```bash
npm test -- src/__tests__/rtl-support.test.ts
```

### Manual Test Checklist
- [ ] Switch language with Language Switcher
- [ ] Verify all text updates immediately
- [ ] Check that layout flips (right-aligned text, reversed flex)
- [ ] Load reciters in both languages
- [ ] Verify Arabic text renders correctly
- [ ] Test with TV remote (up/down/left/right)

## 📚 Documentation

### Comprehensive Guides
1. **[MULTILINGUAL.md](./MULTILINGUAL.md)** - Complete implementation guide
   - Architecture overview
   - Detailed usage examples
   - RTL checklist for new components
   - Troubleshooting guide

2. **[RTL_TESTING_REPORT.md](./RTL_TESTING_REPORT.md)** - Testing documentation
   - Implementation details
   - Test coverage matrix
   - Manual testing results
   - Performance metrics

## ⚡ Quick Reference: Most Common Tasks

### Use Translation in Component
```tsx
const { t } = useTranslation();
<Text>{t('key.to.translation')}</Text>
```

### Make Layout RTL-Aware
```tsx
const { isRTL } = useLanguage();
<View style={{ flexDirection: getFlexDirection() }}>...</View>
```

### Toggle Language
```tsx
const { toggleLanguage } = useLanguage();
<Button onPress={toggleLanguage}>Switch Language</Button>
```

### Change All Margins for RTL
```tsx
marginRight: isRTL ? 0 : 12,
marginLeft: isRTL ? 12 : 0,
```

## 🐛 Troubleshooting

**Problem**: Arabic text not showing
- **Solution**: Verify font supports Arabic (system fonts do by default)

**Problem**: RTL layout not applying
- **Solution**: Use `getFlexDirection()` instead of hardcoded 'row'

**Problem**: Language doesn't change
- **Solution**: Ensure `LanguageProvider` wraps your components in App.tsx

**Problem**: Reciters loading in wrong language
- **Solution**: The API automatically uses current language; check device language setting

## 📝 Translation Guidelines

When adding new translations:

1. **Keep keys consistent** - Use dot notation: `section.subsection.key`
2. **Use context** - Keys should be self-documenting
3. **Maintain parallel structure** - Same keys in en.json and ar.json
4. **Test bidirectional** - Verify both English and Arabic render correctly
5. **Consider length** - Arabic text can be 20-30% longer; allow space

## 🎯 What's Next?

Suggested enhancements (not required, but recommended):

1. **Persist Language Choice**
   - Save to AsyncStorage
   - Load on app startup

2. **Add More Languages**
   - French (fr)
   - Turkish (tr)
   - Urdu (ur)
   - Indonesian (id)

3. **Advanced Features**
   - Pluralization support
   - Date/number formatting
   - RTL-specific animations

4. **Testing**
   - E2E tests with Detox
   - Visual regression tests
   - Accessibility audits

## ✅ Verification Checklist

Before deploying, verify:

- [ ] App launches without errors
- [ ] English language works
- [ ] Arabic language works
- [ ] Language switcher toggles correctly
- [ ] RTL layout flips when Arabic is selected
- [ ] API calls use correct language endpoint
- [ ] Arabic text displays without encoding issues
- [ ] All screens work in both languages
- [ ] Focus states work in RTL mode
- [ ] Tests pass: `npm test -- rtl-support.test.ts`

## 📞 Support

For detailed information, see:
- [MULTILINGUAL.md](./MULTILINGUAL.md) - Implementation guide
- [RTL_TESTING_REPORT.md](./RTL_TESTING_REPORT.md) - Test results
- Code comments in `src/i18n/` and `src/utils/`

---

**Implementation Status**: ✅ Complete and Production Ready
**Last Updated**: December 15, 2025
