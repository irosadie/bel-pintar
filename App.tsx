/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unstable-nested-components */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { Fragment, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Alert, Linking, SafeAreaView, StatusBar } from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  AndroidVisibility,
  AuthorizationStatus,
  EventDetail,
  EventType,
} from '@notifee/react-native';
import SplashScreen from 'react-native-splash-screen';
import Toast from 'react-native-toast-message';
import { channelId } from './src/const';
import TrackPlayer, { AddTrack, Event, State } from 'react-native-track-player';
import { useRecoilState } from 'recoil';
import { isShowPlayingCard } from './src/stores/atom';
import { audioSchema, bellSchema } from './src/schemas';
import { AudioProps, BellProps } from './src/types';
import Realm from 'realm';
import { setRecoil } from 'recoil-nexus';
import { LogBox } from 'react-native';
import { MainNavigator } from './src/navigations/main';

LogBox.ignoreAllLogs();

const CHANNEL_ID = channelId;

const fetchingData = async (id: string) => {
  const realm = await Realm.open({
    path: 'bell.realm',
    schema: [bellSchema],
  });

  const result = realm
    .objects<BellProps>('Bell')
    .find(item => item.key === id);

  const realmAudio = await Realm.open({
    path: 'audio.realm',
    schema: [audioSchema],
  });

  const audio = realmAudio
    .objects<AudioProps>('Audio')
    .find(item => item.key === result?.audioKey as string);
  if (result && audio) {
    await TrackPlayer.reset();

    setRecoil(isShowPlayingCard, {
      notification: true,
      playing: false,
      data: {
        bellName: result.name,
        bellTime: result.time,
        audioName: audio.name,
      },
    });

    await TrackPlayer.add({
      id: audio.key,
      artist: audio.name,
      title: audio.name,
      url: audio.path,
      loop: false,
    } as AddTrack);
    await TrackPlayer.play();
  }
};

const setupBellAudio = async (type: EventType, detail: EventDetail) => {
  if (type === EventType.DELIVERED) {
    if (detail.notification && detail.notification.data) {
      if (detail.notification.data.type === 'trigger') {
        const id = detail.notification.id;

        await fetchingData(id as string);
      }
    }
  }
};

notifee.onForegroundEvent(async ({ type, detail }) => {
  await setupBellAudio(type, detail);
});

notifee.onBackgroundEvent(async ({ type, detail }) => {
  await setupBellAudio(type, detail);
});

const App = () => {
  const [isPlayingCard, setIsPlayingCard] = useRecoilState(isShowPlayingCard);
  const notification = useRef(false);
  const ringing = useRef(false);

  useEffect(() => {
    if (isPlayingCard.notification) {
      notification.current = true;
    }
    else {
      notification.current = false;
    }
    if (isPlayingCard.playing) {
      ringing.current = true;
    }
    else {
      ringing.current = false;
    }
  }, [isPlayingCard]);

  useEffect(() => {
    SplashScreen.hide();
    (async () => {
      await checkNotificationPermission();
      await checkNotificationChannel();
    })();
  }, []);

  const playbackStateListener = async ({ state }: { state: State }) => {
    if (state === State.Playing) {
      setIsPlayingCard(prev => {
        return { ...prev, playing: true };
      });
    }
    if (notification.current && ringing.current && (state === State.Ended || state === State.Stopped)) {
      setIsPlayingCard(() => {
        return { notification: false, playing: false, data: null };
      });
    }
  };

  useEffect(() => {
    const sub = TrackPlayer.addEventListener(Event.PlaybackState, playbackStateListener);
    return () => {
      sub.remove();
    };
  }, []);

  // check app permissions
  const checkNotificationPermission = async () => {
    const settings = await notifee.getNotificationSettings();
    if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      Alert.alert(
        'Izin Dibatasi',
        'Untuk memastikan bell berbunyi, harap izinkan notifikasi aplikasi.',
        [
          {
            text: 'Buka Pengaturan',
            onPress: async () => await Linking.openSettings(),
          },
          {
            text: 'Batal',
            onPress: () => null,
            style: 'cancel',
          },
        ],
        { cancelable: false },
      );
    }
    if (settings.android.alarm === AndroidNotificationSetting.DISABLED) {
      Alert.alert(
        'Izin Dibatasi',
        'Untuk memastikan bell berbunyi, harap izinkan pengaturan alarm.',
        [
          {
            text: 'Buka Pengaturan',
            onPress: async () => await notifee.openAlarmPermissionSettings(),
          },
          {
            text: 'Batal',
            onPress: () => null,
            style: 'cancel',
          },
        ],
        { cancelable: false },
      );
    }

    const powerManagerInfo = await notifee.getPowerManagerInfo();
    if (powerManagerInfo.activity) {
      Alert.alert(
        'Pembatasan Terdetaksi',
        'Untuk memastikan bell berbunyi, harap sesuaikan pengaturan Power Manager.',
        [
          {
            text: 'Buka Pengaturan',
            onPress: async () => await notifee.openPowerManagerSettings(),
          },
          {
            text: 'Batal',
            onPress: () => null,
            style: 'cancel',
          },
        ],
        { cancelable: false },
      );
    }
    const batteryOptimizationEnabled =
      await notifee.isBatteryOptimizationEnabled();
    if (batteryOptimizationEnabled) {
      Alert.alert(
        'Pembatasan Terdetaksi',
        'Untuk memastikan notifikasi terkirim, harap nonaktifkan Pengoptimalan Baterai (Battery Optimization) untuk aplikasi.',
        [
          {
            text: 'Buka Pengaturan',
            onPress: async () =>
              await notifee.openBatteryOptimizationSettings(),
          },
          {
            text: 'Batal',
            onPress: () => null,
            style: 'cancel',
          },
        ],
        { cancelable: false },
      );
    }
  };

  // check channel, jika tidak ada maka buat...
  const checkNotificationChannel = async () => {
    const channel = await notifee.getChannel(CHANNEL_ID);

    if (!channel) {
      await notifee.createChannel({
        id: CHANNEL_ID,
        name: 'Bel Sekolah',
        bypassDnd: true,
        visibility: AndroidVisibility.PUBLIC,
        importance: AndroidImportance.HIGH,
        badge: false,
      });
    }
  };

  return (
    <Fragment>
      <StatusBar backgroundColor="#e9bd19" barStyle="default" />
      <SafeAreaView className="h-full w-full flex-1">
        <BottomSheetModalProvider>
          <NavigationContainer>
            <MainNavigator />
          </NavigationContainer>
          <Toast />
        </BottomSheetModalProvider>
      </SafeAreaView>
    </Fragment>
  );
};

export default App;
