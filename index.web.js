window.process = window.process || { env: { NODE_ENV: 'development' } }

if (typeof __DEV__ === 'undefined') {
  window.__DEV__ = window.process.env.NODE_ENV !== 'production';
}

import { I18nManager } from 'react-native';

I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

import { AppRegistry } from 'react-native';
import App from './App';
import appConfig from './app.json';

const appName = appConfig.name;

AppRegistry.registerComponent(appName, () => App);

AppRegistry.runApplication(appName, {
  initialProps: {},
  rootTag: document.getElementById('root'),
});
