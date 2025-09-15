/**
 * FANZ Mobile App Entry Point
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/FanzMobileApp';
import {name as appName} from './app.json';

// Ignore specific warnings in development
if (__DEV__) {
  import('./ReactotronConfig').then(() => console.log('Reactotron Configured'));
}

AppRegistry.registerComponent(appName, () => App);