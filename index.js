import 'react-native-gesture-handler';
import 'react-native-reanimated'; // must be imported before any navigation/animated code
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
