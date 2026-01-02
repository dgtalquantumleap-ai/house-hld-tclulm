
# Splash Screen & App Icon - Quick Reference

## 🎯 What Was Changed

### App Icon
- **Old**: Generic Natively icon
- **New**: HOUSEHLD house illustration
- **Location**: `assets/images/d0b91751-d7d5-4486-a5c4-71cf4d50c705.png`

### Splash Screen
- **Old**: Natively icon with indigo background
- **New**: House icon with light/dark mode support
- **Colors**: 
  - Light: `#F5F7FA`
  - Dark: `#1A1A1A`

---

## 🚀 Quick Test

```bash
# Clear cache and restart
npx expo start --clear

# Test on iOS
npx expo run:ios

# Test on Android
npx expo run:android
```

---

## 📱 What You'll See

### On Launch
1. Light blue/gray background (or dark gray in dark mode)
2. Centered house icon (200px)
3. Smooth fade transition (500ms)
4. App loads immediately after fonts ready

### On Home Screen
- **iOS**: House icon with rounded corners (applied by iOS)
- **Android**: Adaptive icon with house foreground

---

## ✅ Verification Checklist

- [ ] App icon shows house on home screen
- [ ] Splash screen shows house icon on launch
- [ ] Light mode works correctly
- [ ] Dark mode works correctly
- [ ] No delays on app startup
- [ ] All existing features work

---

## 🔧 Configuration Files

### app.json
```json
{
  "expo": {
    "icon": "./assets/images/d0b91751-d7d5-4486-a5c4-71cf4d50c705.png",
    "splash": {
      "image": "./assets/images/d0b91751-d7d5-4486-a5c4-71cf4d50c705.png",
      "backgroundColor": "#F5F7FA"
    },
    "plugins": [
      ["expo-splash-screen", {
        "backgroundColor": "#F5F7FA",
        "image": "./assets/images/d0b91751-d7d5-4486-a5c4-71cf4d50c705.png",
        "dark": {
          "backgroundColor": "#1A1A1A"
        }
      }]
    ]
  }
}
```

---

## 🐛 Common Issues

### Issue: Splash screen not updating
**Solution**: 
```bash
npx expo start --clear
# Then rebuild
npx expo run:ios
```

### Issue: Icon not changing
**Solution**: 
1. Delete app from device
2. Rebuild and reinstall

### Issue: Dark mode not working
**Solution**: 
1. Enable dark mode on device
2. Rebuild app
3. Check `userInterfaceStyle: "automatic"` in app.json

---

## 📚 Documentation

- [Expo Splash Screen](https://docs.expo.dev/versions/latest/sdk/splash-screen/)
- [App Icons Guide](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/)
- [Adaptive Icons](https://developer.android.com/develop/ui/views/launch/icon_design_adaptive)

---

## 🎨 Asset Specifications

### App Icon
- **Size**: 1024×1024 (iOS), adaptive (Android)
- **Format**: PNG
- **Transparency**: None
- **Corners**: Square (iOS rounds automatically)

### Splash Screen
- **Size**: 200px width (auto height)
- **Format**: PNG
- **Background**: Solid color
- **Position**: Centered

---

## 💡 Tips

1. **Always test on real devices** before submitting to stores
2. **Clear cache** if changes don't appear
3. **Use release builds** for final testing
4. **Check both light and dark modes**
5. **Verify on multiple screen sizes**

---

**Last Updated**: January 2025
