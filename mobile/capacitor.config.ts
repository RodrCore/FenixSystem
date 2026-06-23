import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.fenixbd.mobile',
  appName: 'FenixApp',
  webDir:  'www',
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor:    '#E11D48',
      androidScaleType:   'CENTER_CROP',
      showSpinner:        false,
      androidSpinnerStyle:'small',
      splashFullScreen:   true,
      splashImmersive:    true,
    },
    CapacitorSQLite: {
      iosDatabaseLocation:     'Library/CapacitorDatabase',
      iosIsEncryption:         false,
      androidIsEncryption:     false,
      electronWindowsLocation: 'C:\\ProgramData\\CapacitorDatabases',
    },
  },
  android: {
    webContentsDebuggingEnabled: false,
  },
};

export default config;