
# Testing Guide - App Icon & Splash Screen

## 🧪 Complete Testing Checklist

Use this guide to thoroughly test the new app icon and splash screen implementation.

---

## 📱 iOS Testing

### Development Build Test
```bash
# Clear cache
npx expo start --clear

# Run on iOS simulator
npx expo run:ios

# Or run on physical device
npx expo run:ios --device
```

### What to Test
- [ ] **App Icon on Home Screen**
  - House icon appears correctly
  - Icon has rounded corners (applied by iOS)
  - Icon is clear and not pixelated
  - Icon looks good in light mode
  - Icon looks good in dark mode

- [ ] **Splash Screen**
  - House icon appears centered
  - Background is soft gray-blue (#F5F7FA) in light mode
  - Background is dark gray (#1A1A1A) in dark mode
  - Icon size is appropriate (200px)
  - Smooth fade animation (500ms)
  - Exits quickly when app is ready

- [ ] **App Behavior**
  - App launches without delays
  - Navigation works correctly
  - Authentication flow works
  - All screens load properly
  - No console errors or warnings

### iOS Devices to Test
- [ ] iPhone 15 Pro (simulator)
- [ ] iPhone 14 (simulator)
- [ ] iPhone SE (simulator)
- [ ] iPad Pro (simulator)
- [ ] Physical iPhone (if available)

---

## 🤖 Android Testing

### Development Build Test
```bash
# Clear cache
npx expo start --clear

# Run on Android emulator
npx expo run:android

# Or run on physical device
npx expo run:android --device
```

### What to Test
- [ ] **App Icon on Home Screen**
  - Adaptive icon appears correctly
  - House foreground is clear
  - Background color is correct (#F5F7FA)
  - Icon adapts to different launcher shapes
  - Icon looks good in light mode
  - Icon looks good in dark mode

- [ ] **Splash Screen**
  - House icon appears centered
  - Background is soft gray-blue (#F5F7FA) in light mode
  - Background is dark gray (#1A1A1A) in dark mode
  - Icon size is appropriate (200px)
  - Smooth fade animation (500ms)
  - Exits quickly when app is ready

- [ ] **App Behavior**
  - App launches without delays
  - Navigation works correctly
  - Authentication flow works
  - All screens load properly
  - No console errors or warnings

### Android Devices to Test
- [ ] Pixel 7 (emulator) - Android 13+
- [ ] Pixel 5 (emulator) - Android 12
- [ ] Pixel 4 (emulator) - Android 11
- [ ] Samsung Galaxy (emulator) - Android 10
- [ ] Physical Android device (if available)

---

## 🌓 Dark Mode Testing

### Enable Dark Mode
**iOS**: Settings → Display & Brightness → Dark
**Android**: Settings → Display → Dark theme

### Test Both Modes
- [ ] **Light Mode**
  - Splash background: #F5F7FA (soft gray-blue)
  - Icon clearly visible
  - Smooth transition

- [ ] **Dark Mode**
  - Splash background: #1A1A1A (dark gray)
  - Icon clearly visible
  - Smooth transition

- [ ] **Mode Switching**
  - Switch between light and dark mode
  - Restart app in each mode
  - Verify splash screen updates correctly

---

## 🔄 Rotation Testing

### Portrait Mode (Primary)
- [ ] Splash screen displays correctly
- [ ] Icon remains centered
- [ ] Background fills entire screen

### Landscape Mode (If supported)
- [ ] Splash screen displays correctly
- [ ] Icon remains centered
- [ ] Background fills entire screen

---

## ⚡ Performance Testing

### Startup Time
- [ ] **Cold Start** (app not in memory)
  - Time from tap to first screen: _____ seconds
  - Splash screen duration: _____ seconds
  - Should be < 3 seconds total

- [ ] **Warm Start** (app in background)
  - Time from tap to first screen: _____ seconds
  - Splash screen duration: _____ seconds
  - Should be < 1 second total

### Memory Usage
- [ ] Check memory usage during splash
- [ ] Verify no memory leaks
- [ ] Monitor app performance after splash

---

## 🐛 Error Testing

### Network Conditions
- [ ] **Offline Mode**
  - Splash screen works without network
  - App loads correctly
  - No network errors during splash

- [ ] **Slow Network**
  - Splash screen doesn't wait for network
  - App loads immediately when ready

### Edge Cases
- [ ] **Force Quit and Relaunch**
  - Splash screen appears correctly
  - App state restores properly

- [ ] **Background and Resume**
  - Splash screen doesn't reappear
  - App resumes correctly

- [ ] **Low Battery Mode**
  - Splash screen works correctly
  - Animation still smooth

---

## 📊 Visual Testing

### Screenshot Checklist
Take screenshots of:
- [ ] App icon on home screen (light mode)
- [ ] App icon on home screen (dark mode)
- [ ] Splash screen (light mode)
- [ ] Splash screen (dark mode)
- [ ] First screen after splash

### Visual Inspection
- [ ] Icon is crisp and clear
- [ ] Colors match design specifications
- [ ] No visual glitches or artifacts
- [ ] Smooth transitions
- [ ] Professional appearance

---

## 🔍 Console Log Testing

### Check for Errors
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Expected Logs
```
✅ RootLayout: Platform: ios/android
✅ RootLayout: Color scheme: light/dark
✅ RootLayout: Fonts loaded, hiding splash screen
✅ RootNavigator: Auth state changed
```

### No Errors Should Appear
- [ ] No splash screen errors
- [ ] No asset loading errors
- [ ] No navigation errors
- [ ] No authentication errors

---

## 🏗️ Build Testing

### Development Build
```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```
- [ ] Builds successfully
- [ ] No warnings
- [ ] No errors

### Production Build
```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```
- [ ] Builds successfully
- [ ] No warnings
- [ ] No errors
- [ ] Splash screen works in production build

---

## 📝 Test Results Template

### Test Session Information
- **Date**: _______________
- **Tester**: _______________
- **Platform**: iOS / Android
- **Device**: _______________
- **OS Version**: _______________
- **Build Type**: Development / Production

### Results
- **App Icon**: ✅ Pass / ❌ Fail
- **Splash Screen**: ✅ Pass / ❌ Fail
- **Light Mode**: ✅ Pass / ❌ Fail
- **Dark Mode**: ✅ Pass / ❌ Fail
- **Performance**: ✅ Pass / ❌ Fail
- **Existing Features**: ✅ Pass / ❌ Fail

### Issues Found
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Notes
_______________________________________________
_______________________________________________
_______________________________________________

---

## ✅ Final Approval Checklist

Before submitting to app stores:
- [ ] All iOS tests passed
- [ ] All Android tests passed
- [ ] Dark mode works correctly
- [ ] Performance is acceptable
- [ ] No console errors
- [ ] Builds successfully
- [ ] Screenshots taken
- [ ] Documentation reviewed
- [ ] Team approval obtained

---

## 🚀 Ready for Submission

Once all tests pass:
1. ✅ Create production builds
2. ✅ Test production builds on physical devices
3. ✅ Prepare app store screenshots
4. ✅ Submit to Apple App Store
5. ✅ Submit to Google Play Store

---

## 📞 Support

If you find any issues during testing:
1. Check the troubleshooting section in APP_ICON_SPLASH_IMPLEMENTATION.md
2. Review console logs for errors
3. Clear cache and rebuild
4. Document the issue with screenshots

---

**Happy Testing! 🎉**
