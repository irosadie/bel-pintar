/**
 * @format
 */
import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import TrackPlayer from 'react-native-track-player';
import { RecoilRoot } from 'recoil';
import RecoilNexus from 'recoil-nexus';
TrackPlayer.setupPlayer();

const Main = () => (
  <RecoilRoot>
    <RecoilNexus />
    <App />
  </RecoilRoot>
);

AppRegistry.registerComponent(appName, () => Main);
