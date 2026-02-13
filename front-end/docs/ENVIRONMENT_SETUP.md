# Environment Configuration

## Development Environment Setup

### Prerequisites

1. **Node.js**: Version 18 or higher
   ```bash
   node --version  # Should be v18.x.x or higher
   ```

2. **npm** or **yarn**
   ```bash
   npm --version  # Should be 9.x.x or higher
   ```

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

4. **Git**
   ```bash
   git --version
   ```

### Platform-Specific Setup

#### For iOS Development (macOS only)

1. **Xcode**: Install from App Store (version 14+)
2. **Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```
3. **CocoaPods**:
   ```bash
   sudo gem install cocoapods
   ```
4. **iOS Simulator**: Available through Xcode

#### For Android Development

1. **Android Studio**: Download and install from [android.com/studio](https://developer.android.com/studio)
2. **Android SDK**: Install via Android Studio
3. **Environment Variables**:
   
   Add to `.bashrc` or `.zshrc`:
   ```bash
   export ANDROID_HOME=$HOME/Library/Android/sdk
   export PATH=$PATH:$ANDROID_HOME/emulator
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   ```

4. **Android Emulator**: Create via Android Studio AVD Manager

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/trinity-dev-app.git
cd trinity-dev-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create `.env` file in project root:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api

# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id_here
PAYPAL_SECRET=your_paypal_secret_here
PAYPAL_ENVIRONMENT=sandbox  # or 'production'

# Optional: Analytics, etc.
ANALYTICS_KEY=your_analytics_key
```

**For development**:
```env
API_BASE_URL=http://localhost:3000/api
```

**For staging**:
```env
API_BASE_URL=https://staging-api.trinity.com/api
```

**For production**:
```env
API_BASE_URL=https://api.trinity.com/api
PAYPAL_ENVIRONMENT=production
```

### 4. Start Development Server

```bash
npm start
```

This will start the Expo development server.

### 5. Run on Device/Emulator

#### iOS (macOS only)
```bash
npm run ios
```

Or press `i` in the Expo CLI to open iOS Simulator.

#### Android
```bash
npm run android
```

Or press `a` in the Expo CLI to open Android Emulator.

#### Physical Device
1. Install **Expo Go** app from App Store/Play Store
2. Scan QR code from terminal

## Environment Files

### .env (Development)
```env
API_BASE_URL=http://10.0.2.2:3000/api  # For Android emulator
# API_BASE_URL=http://localhost:3000/api  # For iOS simulator
PAYPAL_CLIENT_ID=sandbox_client_id
PAYPAL_ENVIRONMENT=sandbox
```

### .env.staging
```env
API_BASE_URL=https://staging-api.trinity.com/api
PAYPAL_CLIENT_ID=staging_client_id
PAYPAL_ENVIRONMENT=sandbox
```

### .env.production
```env
API_BASE_URL=https://api.trinity.com/api
PAYPAL_CLIENT_ID=production_client_id
PAYPAL_ENVIRONMENT=production
```

## Building for Production

### iOS

1. **Configure Xcode Project**:
   ```bash
   npx expo prebuild --platform ios
   ```

2. **Open in Xcode**:
   ```bash
   open ios/TrinityMobileApp.xcworkspace
   ```

3. **Set up Signing & Capabilities**:
   - Select your development team
   - Configure bundle identifier
   - Enable required capabilities

4. **Build for Testing**:
   ```bash
   cd ios
   xcodebuild -workspace TrinityMobileApp.xcworkspace \
     -scheme TrinityMobileApp \
     -configuration Release \
     -sdk iphonesimulator
   ```

5. **Archive for Distribution**:
   - Product → Archive in Xcode
   - Distribute to App Store Connect

### Android

1. **Configure Android Project**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Generate Keystore** (first time only):
   ```bash
   keytool -genkey -v -keystore trinity-release.keystore \
     -alias trinity -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Configure Gradle** (`android/gradle.properties`):
   ```properties
   TRINITY_RELEASE_STORE_FILE=trinity-release.keystore
   TRINITY_RELEASE_KEY_ALIAS=trinity
   TRINITY_RELEASE_STORE_PASSWORD=your_store_password
   TRINITY_RELEASE_KEY_PASSWORD=your_key_password
   ```

4. **Build APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

5. **Build AAB (for Play Store)**:
   ```bash
   ./gradlew bundleRelease
   ```

## Development Workflow

### 1. Start Backend API (if running locally)

```bash
cd ../trinity-backend
npm start
```

### 2. Start Mobile App

```bash
npm start
```

### 3. Development Tools

- **React Native Debugger**: Download from [GitHub](https://github.com/jhen0409/react-native-debugger)
- **Flipper**: Download from [fbflipper.com](https://fbflipper.com/)

### 4. Hot Reloading

- Press `r` in Expo CLI to reload
- Shake device or press `Cmd+D` (iOS) / `Cmd+M` (Android) for dev menu

## Troubleshooting

### Common Issues

#### 1. Metro Bundler Cache Issues

```bash
npm start -- --clear
```

or

```bash
npx expo start -c
```

#### 2. iOS Pod Install Issues

```bash
cd ios
pod install --repo-update
```

#### 3. Android Build Issues

```bash
cd android
./gradlew clean
cd ..
npm start
```

#### 4. Node Modules Issues

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

#### 5. Port Already in Use

```bash
# Kill process on port 19000
lsof -ti:19000 | xargs kill -9
```

### Platform-Specific Issues

#### iOS

- **Xcode Version**: Ensure using Xcode 14+
- **Simulator Issues**: Reset simulator: Device → Erase All Content and Settings
- **Certificate Issues**: Check Apple Developer account settings

#### Android

- **Emulator Won't Start**: Check ANDROID_HOME and SDK installation
- **Build Failed**: Clean project: `./gradlew clean`
- **ADB Issues**: Restart ADB: `adb kill-server && adb start-server`

## Testing Environment

### Run Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Linter

```bash
npm run lint
```

## CI/CD Environment

The project uses GitHub Actions for CI/CD. Required secrets:

- `ANDROID_KEYSTORE`: Base64 encoded keystore
- `ANDROID_KEYSTORE_PASSWORD`: Keystore password
- `ANDROID_KEY_ALIAS`: Key alias
- `ANDROID_KEY_PASSWORD`: Key password
- `IOS_CERTIFICATE`: iOS distribution certificate
- `IOS_PROVISIONING_PROFILE`: Provisioning profile
- `PAYPAL_CLIENT_ID`: PayPal client ID
- `PAYPAL_SECRET`: PayPal secret

## Deployment

### Expo EAS Build (Recommended)

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS**:
   ```bash
   eas build:configure
   ```

4. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```

5. **Build for Android**:
   ```bash
   eas build --platform android
   ```

### Manual Deployment

#### iOS TestFlight

1. Archive in Xcode
2. Upload to App Store Connect
3. Submit for review

#### Android Play Store

1. Build signed AAB
2. Upload to Google Play Console
3. Submit for review

## Performance Monitoring

### Enable Hermes (Android)

Edit `android/app/build.gradle`:
```gradle
project.ext.react = [
    enableHermes: true
]
```

### Performance Profiling

```bash
# iOS
npx react-native run-ios --configuration Release

# Android
npx react-native run-android --variant=release
```

## Security

### Secure API Keys

- Never commit `.env` files
- Use environment-specific configuration
- Rotate keys regularly

### Code Obfuscation

Enable ProGuard for Android:
```gradle
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
