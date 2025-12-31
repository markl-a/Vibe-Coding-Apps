# Mobile Applications

A comprehensive collection of mobile application projects demonstrating cross-platform and native mobile development, built with AI-assisted development tools.

## Overview

This directory contains production-ready mobile application examples built with React Native, Flutter, iOS (Swift/SwiftUI), and Android (Kotlin/Jetpack Compose). Each project showcases modern mobile development patterns, responsive design, and platform-specific optimizations.

## Projects

### 1. React Native (`react-native/`)

Cross-platform mobile applications for iOS and Android using React Native.

**Projects:**
- `dashboard-mobile-app` - Analytics and metrics dashboard
- `social-mobile-app` - Social networking application
- `ai-voice-notes-app` - AI-powered voice note taking
- `marketplace-mobile-app` - E-commerce marketplace

**Shared Resources:**
- `shared/components/` - Reusable UI components
- `shared/hooks/` - Custom React hooks
- `shared/services/` - API and utility services
- `shared/theme/` - Design system and theming

**Key Features:**
- Cross-platform compatibility (iOS & Android)
- Native performance with Expo
- Push notifications
- Offline-first architecture
- Biometric authentication
- Camera and media access
- Location services
- In-app purchases

### 2. Flutter (`flutter/`)

High-performance cross-platform apps using Flutter and Dart.

**Projects:**
- `expense-tracker` - Personal finance management
- `fitness-tracker` - Workout and health tracking
- `recipe-app` - Recipe browser and meal planner

**Shared Resources:**
- `shared/widgets/` - Reusable Flutter widgets
- `shared/models/` - Data models
- `shared/services/` - Backend services

**Key Features:**
- Beautiful, natively compiled applications
- Fast development with hot reload
- Expressive and flexible UI
- Native performance
- Rich widget library
- Platform-specific adaptations
- State management (Provider, Riverpod, Bloc)

### 3. iOS Native (`ios-native/`)

Native iOS applications built with Swift and SwiftUI.

**Projects:**
- Swift-based iOS apps
- SwiftUI modern UI components
- iOS-specific features and integrations

**Key Features:**
- Native iOS performance
- SwiftUI declarative syntax
- Core Data integration
- CloudKit sync
- HealthKit integration
- ARKit augmented reality
- SiriKit integration
- App Clips support

### 4. Android Native (`android-native/`)

Native Android applications built with Kotlin and Jetpack Compose.

**Projects:**
- Kotlin-based Android apps
- Jetpack Compose modern UI
- Android-specific features

**Key Features:**
- Native Android performance
- Jetpack Compose UI
- Room database
- WorkManager background tasks
- Material Design 3
- Compose Navigation
- Coroutines and Flow
- ML Kit integration

## Technology Stack

### Cross-Platform Frameworks

#### React Native
- **React Native** - JavaScript framework for iOS and Android
- **Expo** - Development platform and toolchain
- **Expo Router** - File-based routing
- **React Navigation** - Navigation library
- **Redux Toolkit** / **Zustand** - State management
- **React Query** - Server state management
- **NativeWind** - Tailwind CSS for React Native
- **React Native Paper** - Material Design components
- **React Native Elements** - Cross-platform UI toolkit

#### Flutter
- **Flutter SDK** - UI toolkit for natively compiled applications
- **Dart** - Programming language
- **Provider** / **Riverpod** / **Bloc** - State management
- **GetX** - State management and routing
- **Dio** - HTTP client
- **Hive** / **Sqflite** - Local database
- **Firebase** - Backend services
- **Freezed** - Code generation for immutable classes

### Native Development

#### iOS (Swift)
- **SwiftUI** - Declarative UI framework
- **UIKit** - Traditional iOS UI framework
- **Combine** - Reactive programming
- **Core Data** - Persistence framework
- **CloudKit** - Apple's cloud service
- **HealthKit** - Health and fitness data
- **ARKit** - Augmented reality
- **StoreKit** - In-app purchases

#### Android (Kotlin)
- **Jetpack Compose** - Modern Android UI toolkit
- **Material Design 3** - Design system
- **Kotlin Coroutines** - Asynchronous programming
- **Flow** - Reactive streams
- **Room** - SQLite abstraction
- **Hilt** / **Koin** - Dependency injection
- **Retrofit** - HTTP client
- **WorkManager** - Background tasks
- **CameraX** - Camera functionality

### Backend & Services
- **Firebase** - Authentication, Firestore, Storage, Analytics
- **Supabase** - Open source Firebase alternative
- **AWS Amplify** - Backend services
- **GraphQL** - API query language
- **REST APIs** - HTTP APIs
- **WebSockets** - Real-time communication
- **Socket.io** - Real-time events

### Testing
- **Jest** - JavaScript testing (React Native)
- **React Native Testing Library** - Component testing
- **Detox** - E2E testing for React Native
- **Flutter Test** - Widget and integration testing
- **XCTest** - iOS testing framework
- **Espresso** - Android UI testing
- **JUnit** - Android unit testing

### DevOps & CI/CD
- **EAS (Expo Application Services)** - Build and submit
- **Fastlane** - Automation for iOS and Android
- **CodePush** - Over-the-air updates
- **GitHub Actions** - CI/CD workflows
- **Bitrise** - Mobile CI/CD platform
- **App Center** - Build, test, distribute

## Getting Started

### Prerequisites

#### For React Native
```bash
# Node.js (v18 or higher)
node --version

# Install Expo CLI
npm install -g expo-cli

# iOS development (macOS only)
xcode-select --install

# Android development
# Install Android Studio and SDK
```

#### For Flutter
```bash
# Install Flutter SDK
# Follow instructions at https://flutter.dev/docs/get-started/install

# Verify installation
flutter doctor

# iOS development (macOS only)
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch

# Android development
# Install Android Studio
```

#### For Native iOS
```bash
# macOS with Xcode required
xcode-select --install

# CocoaPods for dependency management
sudo gem install cocoapods
```

#### For Native Android
```bash
# Install Android Studio
# Configure Android SDK
# Set ANDROID_HOME environment variable
```

### Installation

#### React Native Project
```bash
# Navigate to project
cd mobile-apps/react-native/<project-name>

# Install dependencies
npm install
# or
pnpm install

# iOS dependencies (macOS only)
cd ios && pod install && cd ..

# Start development server
npx expo start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

#### Flutter Project
```bash
# Navigate to project
cd mobile-apps/flutter/<project-name>

# Get dependencies
flutter pub get

# Run on connected device/emulator
flutter run

# Run on specific device
flutter run -d <device-id>
```

#### Native iOS Project
```bash
# Navigate to project
cd mobile-apps/ios-native/<project-name>

# Install dependencies
pod install

# Open in Xcode
open *.xcworkspace

# Build and run from Xcode
```

#### Native Android Project
```bash
# Navigate to project
cd mobile-apps/android-native/<project-name>

# Open in Android Studio
# Or build from command line
./gradlew assembleDebug

# Install on connected device
./gradlew installDebug
```

## Common Patterns

### 1. React Native Project Structure

```
project-name/
├── app/                  # Expo Router app directory
│   ├── (tabs)/          # Tab navigation
│   ├── _layout.tsx      # Root layout
│   └── index.tsx        # Home screen
├── components/          # Reusable components
├── hooks/               # Custom hooks
├── services/            # API services
├── store/               # State management
├── types/               # TypeScript types
├── utils/               # Utility functions
├── assets/              # Images, fonts
├── app.json            # Expo configuration
└── package.json
```

### 2. Flutter Project Structure

```
project-name/
├── lib/
│   ├── main.dart           # Entry point
│   ├── app.dart            # App configuration
│   ├── screens/            # Screen widgets
│   ├── widgets/            # Reusable widgets
│   ├── models/             # Data models
│   ├── services/           # Backend services
│   ├── providers/          # State management
│   └── utils/              # Utilities
├── assets/                 # Images, fonts
├── pubspec.yaml           # Dependencies
└── test/                  # Tests
```

### 3. Navigation (React Native)

```typescript
// Using Expo Router
import { Stack, Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
    </Stack>
  );
}
```

### 4. State Management (Flutter)

```dart
// Using Riverpod
import 'package:flutter_riverpod/flutter_riverpod.dart';

final counterProvider = StateProvider<int>((ref) => 0);

class CounterWidget extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);
    return Text('$count');
  }
}
```

### 5. API Integration (React Native)

```typescript
// Using React Query
import { useQuery } from '@tanstack/react-query';

function UserProfile() {
  const { data, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => fetch('/api/user').then(res => res.json())
  });

  if (isLoading) return <ActivityIndicator />;
  return <Text>{data.name}</Text>;
}
```

### 6. Local Storage (Flutter)

```dart
// Using Hive
import 'package:hive/hive.dart';

// Store data
final box = await Hive.openBox('myBox');
await box.put('key', 'value');

// Retrieve data
final value = box.get('key');
```

### 7. Push Notifications (React Native)

```typescript
// Using Expo Notifications
import * as Notifications from 'expo-notifications';

// Request permissions
const { status } = await Notifications.requestPermissionsAsync();

// Get push token
const token = await Notifications.getExpoPushTokenAsync();

// Handle received notifications
Notifications.addNotificationReceivedListener(notification => {
  console.log(notification);
});
```

## AI-Assisted Development

### Recommended AI Tools

1. **GitHub Copilot**
   - Component scaffolding
   - Boilerplate code generation
   - API integration helpers

2. **Claude Code**
   - Architecture design
   - Code refactoring
   - Bug diagnosis and fixing

3. **Cursor**
   - Full-stack mobile development
   - Multi-file editing
   - Documentation generation

4. **ChatGPT / Claude**
   - UI/UX design suggestions
   - Algorithm optimization
   - Platform-specific guidance

### AI Development Workflow

1. **Design Phase**
   - Generate wireframes and mockups descriptions
   - Design component hierarchy
   - Plan state management architecture

2. **Development Phase**
   - AI-assisted screen implementation
   - Auto-complete for navigation setup
   - Generate API integration code

3. **Testing Phase**
   - Generate unit tests
   - Create integration test scenarios
   - Accessibility testing suggestions

4. **Optimization Phase**
   - Performance profiling insights
   - Bundle size optimization
   - Memory leak detection

## Best Practices

### Performance
- Optimize FlatList/ListView with proper keys and memo
- Use React.memo() for expensive components
- Implement lazy loading for images
- Minimize bridge communication (React Native)
- Use const constructors (Flutter)
- Avoid unnecessary rebuilds

### Code Quality
- Use TypeScript for type safety (React Native)
- Follow platform-specific style guides
- Implement proper error handling
- Use linting and formatting tools
- Write comprehensive tests
- Document complex logic

### UI/UX
- Follow platform design guidelines (iOS HIG, Material Design)
- Implement proper loading states
- Handle offline scenarios gracefully
- Optimize for different screen sizes
- Test on multiple devices
- Implement haptic feedback

### Security
- Store sensitive data securely (Keychain, Keystore)
- Use HTTPS for all network requests
- Implement certificate pinning
- Validate all user inputs
- Use biometric authentication where appropriate
- Keep dependencies updated

### Accessibility
- Add accessibility labels
- Support screen readers
- Ensure proper color contrast
- Implement keyboard navigation
- Support dynamic font sizes
- Test with accessibility tools

## Testing

### React Native Testing
```bash
# Unit tests
npm test

# E2E tests with Detox
detox test --configuration ios.sim.debug

# Component testing
npm run test:components
```

### Flutter Testing
```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test

# Widget tests
flutter test test/widget_test.dart
```

### Native Testing
```bash
# iOS tests
xcodebuild test -workspace App.xcworkspace -scheme App

# Android tests
./gradlew test
./gradlew connectedAndroidTest
```

## Deployment

### React Native (Expo)
```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Play Store
eas submit --platform android
```

### Flutter
```bash
# Build iOS
flutter build ios --release

# Build Android APK
flutter build apk --release

# Build Android App Bundle
flutter build appbundle --release
```

## Contributing

Contributions are welcome! Please see the main [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Adding a New Project

1. Choose the appropriate platform directory
2. Create project with standard structure
3. Include comprehensive README.md
4. Add example environment configuration
5. Write tests
6. Update this README

## Resources

### Documentation
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Flutter Documentation](https://docs.flutter.dev/)
- [iOS Developer Documentation](https://developer.apple.com/documentation/)
- [Android Developer Documentation](https://developer.android.com/docs)

### Learning Resources
- [React Native School](https://www.reactnativeschool.com/)
- [Flutter Codelabs](https://docs.flutter.dev/codelabs)
- [Hacking with Swift](https://www.hackingwithswift.com/)
- [Android Developers Codelabs](https://codelabs.developers.google.com/)

### Tools
- [Expo Snack](https://snack.expo.dev/) - Online React Native playground
- [DartPad](https://dartpad.dev/) - Online Dart/Flutter editor
- [Firebase](https://firebase.google.com/) - Backend services
- [Flipper](https://fbflipper.com/) - Mobile debugging platform

### Community
- [React Native Community](https://reactnative.dev/community/overview)
- [Flutter Community](https://flutter.dev/community)
- [iOS Dev Weekly](https://iosdevweekly.com/)
- [Android Weekly](https://androidweekly.net/)

## License

All projects in this directory are licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## Related Directories

- [Web Apps](../web-apps/) - Web application projects
- [Games](../games/) - Game development projects
- [Desktop Apps](../desktop-apps/) - Desktop applications
- [AI/ML Projects](../ai-ml-projects/) - AI and machine learning

---

**Note**: All projects are for educational and demonstration purposes. Review and test thoroughly before deploying to production. Ensure compliance with App Store and Play Store guidelines.

*Last updated: 2025-12-31*
