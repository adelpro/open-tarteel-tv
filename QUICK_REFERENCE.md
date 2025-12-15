# Multi-Language & RTL - Developer Quick Reference

## 🎯 At a Glance

| Need | Solution | Code |
|------|----------|------|
| Show translated text | Use `useTranslation()` hook | `<Text>{t('key')}</Text>` |
| RTL-aware row layout | Use `getFlexDirection()` | `flexDirection: getFlexDirection()` |
| Right-aligned text | Use `getTextAlign()` | `textAlign: getTextAlign()` |
| Check if RTL | Use `useLanguage()` hook | `const { isRTL } = useLanguage()` |
| Switch language | Use `toggleLanguage()` | `const { toggleLanguage } = useLanguage()` |
| Position from start | Use `getPositionStart()` | `...getPositionStart(10)` |
| Position from end | Use `getPositionEnd()` | `...getPositionEnd(10)` |

## 📦 Imports You'll Need

```tsx
// Translations
import { useTranslation } from 'react-i18next';

// Language & RTL
import { useLanguage } from '../context/LanguageContext';
import {
  getTextAlign,
  getFlexDirection,
  getHorizontalAlign,
  getPositionStart,
  getPositionEnd,
  getTextDirection,
} from '../utils/rtl';
```

## 🎨 Common Styling Patterns

### Row Layout
```tsx
flexDirection: getFlexDirection()  // 'row' or 'row-reverse'
```

### Text Alignment
```tsx
textAlign: getTextAlign()  // 'left' or 'right'
```

### Horizontal Margins (RTL-Aware)
```tsx
marginRight: isRTL ? 0 : 12,
marginLeft: isRTL ? 12 : 0,
```

### Horizontal Padding (RTL-Aware)
```tsx
paddingRight: isRTL ? 0 : 16,
paddingLeft: isRTL ? 16 : 0,
```

### Start Position (Left in LTR, Right in RTL)
```tsx
...getPositionStart(10)  // {left: 10} or {right: 10}
```

### End Position (Right in LTR, Left in RTL)
```tsx
...getPositionEnd(10)  // {right: 10} or {left: 10}
```

### Icon/Image Margin
```tsx
marginRight: isRTL ? 0 : 8,
marginLeft: isRTL ? 8 : 0,
```

## 📝 Translation Examples

### Simple Text
```json
// en.json
"home": {
  "title": "Choose a Reciter"
}

// ar.json
"home": {
  "title": "اختر القارئ"
}
```

```tsx
const { t } = useTranslation();
<Text>{t('home.title')}</Text>
```

### With Variables
```json
{
  "player": {
    "surahCount": "Surah {{current}} of {{total}}"
  }
}
```

```tsx
<Text>{t('player.surahCount', { current: 5, total: 114 })}</Text>
```

### Plural Forms (When Implemented)
```json
{
  "search": {
    "results": "Found {{count}} reciter",
    "results_plural": "Found {{count}} reciters"
  }
}
```

```tsx
<Text>{t('search.results', { count: 5 })}</Text>
```

## 🔤 Translation Keys Cheat Sheet

```
app.title              → App name
app.subtitle           → App tagline

navigation.home        → Home screen
navigation.player      → Player screen
navigation.about       → About screen
navigation.privacy     → Privacy screen

home.title             → "Choose a Reciter" / "اختر القارئ"
home.search            → Search placeholder
home.loading           → Loading message
home.error             → Error message
home.retry             → Retry button
home.noResults         → No results message
home.filterBy          → Filter label
home.allRiwaya         → "All" filter

player.title           → Now playing title
player.surah           → "Surah" label
player.reciter         → "Reciter" label
player.playPause       → Play/pause button
player.nextSurah       → Next button
player.previousSurah   → Previous button

riwaya.hafs            → Hafs an Asim
riwaya.warsh           → Warsh an Nafi
riwaya.qalun           → Qalun an Nafi
riwaya.alduri          → Alduri an Alkaissai

surahs.1 to .114       → All 114 Surah names

common.about           → About
common.privacy         → Privacy
common.language        → Language
common.english         → English
common.arabic          → العربية
common.settings        → Settings
common.close           → Close
```

## 🔄 Language Switching Flow

```
User clicks Language Switcher
         ↓
toggleLanguage() called
         ↓
i18n.changeLanguage('ar' or 'en')
         ↓
LanguageContext updates
         ↓
Components re-render with:
  - New translations
  - New RTL state
  - New layout direction
         ↓
API calls next reciter with new language parameter
         ↓
UI displays in new language with correct layout
```

## 🧪 Testing Your Changes

```bash
# Run all tests
npm test

# Run only RTL tests
npm test -- rtl-support.test.ts

# Watch mode
npm test -- --watch
```

## ⚡ Performance Tips

✅ **Do This**
- Use `getFlexDirection()` instead of ternary for flex
- Use `getTextAlign()` for text alignment
- Memoize style objects when possible
- Import only needed RTL functions

❌ **Don't Do This**
- Hardcode `flexDirection: 'row'`
- Hardcode `marginRight: 12`
- Hardcode `textAlign: 'left'`
- Create new style objects in render
- Import all RTL functions if using one

## 🐛 Common Mistakes

### ❌ Wrong
```tsx
// Hardcoded direction
style={{
  flexDirection: 'row',
  marginRight: 12,
  textAlign: 'left',
}}
```

### ✅ Right
```tsx
const { isRTL } = useLanguage();
style={{
  flexDirection: getFlexDirection(),
  marginRight: isRTL ? 0 : 12,
  marginLeft: isRTL ? 12 : 0,
  textAlign: getTextAlign(),
}}
```

### ❌ Wrong
```tsx
<Text>Always English</Text>
```

### ✅ Right
```tsx
const { t } = useTranslation();
<Text>{t('home.title')}</Text>
```

### ❌ Wrong
```tsx
// Missing context
const { isRTL } = useContext(LanguageContext);  // ❌
```

### ✅ Right
```tsx
// Use the hook
const { isRTL } = useLanguage();  // ✅
```

## 📋 New Component Checklist

When creating a new component, verify:

- [ ] All hardcoded text wrapped in `t('key')`
- [ ] Add translation keys to en.json and ar.json
- [ ] Used `getFlexDirection()` for row layouts
- [ ] Used `getTextAlign()` for text alignment
- [ ] Conditional margins/padding for RTL
- [ ] Added `direction: isRTL ? 'rtl' : 'ltr'` to containers
- [ ] Tested in both English and Arabic
- [ ] Tested with TV remote navigation
- [ ] No hardcoded left/right positioning

## 🎬 Creating RTL Animations

```tsx
// Flip animation based on direction
const { isRTL } = useLanguage();

const slideInStyle = {
  transform: [
    {
      translateX: animated.interpolate({
        inputRange: [0, 1],
        outputRange: [isRTL ? -100 : 100, 0],
      })
    }
  ]
};
```

## 📊 RTL Function Matrix

```
getTextAlign()          → String ('left'|'right')
getFlexDirection()      → String ('row'|'row-reverse')
getHorizontalAlign()    → String ('flex-start'|'flex-end')
getOppositeHorizontalAlign() → String (opposite)
getPositionStart(n)     → Object ({left: n}|{right: n})
getPositionEnd(n)       → Object ({right: n}|{left: n})
getRTLFlip()            → Number (1|-1)
getTextDirection()      → String ('ltr'|'rtl')
getWritingDirection()   → String ('ltr'|'rtl')
```

## 🔗 Quick Links

| Resource | Purpose | Location |
|----------|---------|----------|
| Main Guide | Implementation details | [MULTILINGUAL.md](./MULTILINGUAL.md) |
| Quick Start | Getting started | [LANGUAGE_SETUP.md](./LANGUAGE_SETUP.md) |
| Test Report | Testing verification | [RTL_TESTING_REPORT.md](./RTL_TESTING_REPORT.md) |
| This Guide | Quick reference | This file |

## 💡 Pro Tips

1. **Always use context hooks** - Don't manually pass RTL flag as prop
2. **Batch RTL checks** - Use `isRTL` from `useLanguage()` once, reference it
3. **Test both directions** - Always test added features in both English and Arabic
4. **Use CSS flexbox** - Much easier to flip with `getFlexDirection()`
5. **Avoid absolute positioning** - Use flexbox/margin instead when possible
6. **Document RTL needs** - Add comments for any RTL-specific logic
7. **Reuse helper functions** - Don't duplicate RTL logic

## 🎓 Learning Path

### Beginner
1. Read LANGUAGE_SETUP.md
2. Try using `t('key')` in a component
3. Test language switching

### Intermediate
1. Use RTL functions in your styles
2. Test a component in both languages
3. Study HomeScreen.tsx examples

### Advanced
1. Create a new component with full RTL support
2. Read MULTILINGUAL.md in detail
3. Implement your own RTL helpers if needed
4. Contribute additional languages

---

**Last Updated**: December 15, 2025
**Version**: 1.0
**Status**: ✅ Ready to Use
