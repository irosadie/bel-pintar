/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  faArrowLeft,
  faBell,
  faBellSlash,
  faClock,
  faEdit,
  faMusic,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import moment from 'moment';
import {
  ScrollView,
  Text,
  View,
  TouchableWithoutFeedback,
  AppState,
} from 'react-native';
import TrackPlayer, {
  useProgress,
  useTrackPlayerEvents,
  State,
  Event,
  Track,
} from 'react-native-track-player';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { audioSchema, bellSchema } from './../../schemas';
import { AudioProps, BellProps } from './../../types';
import { seconds2time } from '@utils/seconds2time';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { days as dayList } from './../../const';
import Slider from '@react-native-community/slider';
import BottomSheet from '@gorhom/bottom-sheet';
import Realm from 'realm';
import Toast from 'react-native-toast-message';
import notifee from '@notifee/react-native';
import _debounce from 'lodash/debounce';
import { useRecoilState } from 'recoil';
import { isShowPlayingCard } from './../../stores/atom';

type RouteParams = {
  bellKey: string;
};

const BellDetailScreen = () => {
  const route = useRoute();
  const { bellKey } = route.params as RouteParams;

  const [isPlayingCard] = useRecoilState(isShowPlayingCard);

  const navigation: any = useNavigation();

  const progressTrack = useProgress(1);

  const [bell, setBell] = useState<
    Omit<BellProps, 'audioKey'> & { audio?: AudioProps }
  >();
  const [isDeleteBell, setIsDeleteBell] = useState(false);
  const [isPlay, setPlay] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [tempTrack, setTempTrack] = useState<Track>();

  const isAlarmRinging = isPlayingCard.notification && isPlayingCard.playing;

  const isAlarmRingingRef = useRef(isAlarmRinging);

  useEffect(() => {
    isAlarmRingingRef.current = isAlarmRinging;
  }, [isAlarmRinging]);

  const handleFetchData = async () => {
    try {
      const realm = await Realm.open({
        schema: [bellSchema],
        path: 'bell.realm',
      });
      const realm2 = await Realm.open({
        schema: [audioSchema],
        path: 'audio.realm',
      });
      const result = realm
        .objects<BellProps>('Bell')
        .find(item => item.key === bellKey);
      if (result) {
        const bellAudio = realm2
          .objects<AudioProps>('Audio')
          .find(item => item.key === result.audioKey);
        setBell({
          ...result,
          audio: bellAudio,
        });
        const track = {
          id: `${Math.random() + moment().unix()}`,
          url: bellAudio?.path as string,
          title: result.name ?? '',
          artist: result.name ?? '',
          loop: false,
        };
        if (!isAlarmRinging) {
          await TrackPlayer.reset();
          await TrackPlayer.add(track);
        } else {
          setTempTrack(track);
        }
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam mengambil data!',
        position: 'bottom',
      });
    }
  };

  const convertPercentageToSeconds = (
    percentage: number,
    totalDuration: number,
  ) => {
    if (isNaN(percentage) || isNaN(totalDuration) || totalDuration <= 0) {
      return 0;
    }
    const positionInSeconds = (percentage / 100) * totalDuration;
    return Math.min(totalDuration, Math.max(0, positionInSeconds));
  };

  const handleDeleteData = async () => {
    const realm = await Realm.open({
      schema: [bellSchema],
      path: 'bell.realm',
    });
    const result = realm
      .objects<BellProps>('Bell')
      .find(item => item.key === bellKey);
    if (result) {
      const check = await notifee.getTriggerNotificationIds();
      if (check.includes(result.key)) {
        await notifee.cancelNotification(result.key);
      }
      realm.write(() => {
        realm.delete(result);
      });
    }
    navigation.goBack();
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleOnPlay = async () => {
    if (isAlarmRinging) {
      Toast.show({
        type: 'info',
        text1: 'Tidak bisa memutar Suara',
        text2: 'Saat bel berdering, kamu tidak bisa memutar suara ini',
        position: 'bottom',
      });
      return;
    }
    const isPlaying = isPlay;
    if (isPlaying) {
      await TrackPlayer.pause();
      return setPlay(!isPlaying);
    }
    if (tempTrack) {
      await TrackPlayer.reset();
      await TrackPlayer.add(tempTrack);
      setTempTrack(undefined);
    }
    await TrackPlayer.play();
    return setPlay(!isPlaying);
  };

  const events = [Event.PlaybackState];

  useTrackPlayerEvents(events, async event => {
    if (event.type === Event.PlaybackState) {
      if (event.state === State.Ended) {
        setPlay(false);
        TrackPlayer.seekTo(0);
        await TrackPlayer.stop();
      }
    }
  });

  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background' && !isAlarmRinging) {
      setPlay(false);
      TrackPlayer.stop();
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
      if (!isAlarmRingingRef.current) {
        TrackPlayer.reset();
      }
    };
  }, []);

  const handleOnSeek = _debounce((value: number) => {
    if (isAlarmRinging) {
      return;
    }
    TrackPlayer.seekTo(
      convertPercentageToSeconds(value, progressTrack.duration),
    );
  }, 750);

  useFocusEffect(
    useCallback(() => {
      handleFetchData();
    }, []),
  );

  const handleEditBell = () => {
    if (isAlarmRinging) {
      Toast.show({
        type: 'info',
        text1: 'Tidak mengubah Bel',
        text2: 'Saat bel berdering, kamu tidak bisa mengubah bel',
        position: 'bottom',
      });
      return;
    }
    navigation.navigate('Bell Edit', { bellKey });
  };

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-slate-50 pb-12 h-full">
        <View className="h-[30vh] bg-yellow-500 items-center justify-end pb-4">
          <View className="absolute top-3 left-4 bg-slate-50 rounded-full p-2 shadow shadow-slate-300">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleGoBack}
              className="bg-transparent">
              <FontAwesomeIcon icon={faArrowLeft} size={20} color="#b2b2b2" />
            </TouchableOpacity>
          </View>
          <View className="absolute top-5 right-5 flex-row gap-6">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsDeleteBell(true)}>
              <FontAwesomeIcon
                icon={faTrashAlt}
                size={22}
                color="#fff"
                style={{ top: 1 }}
              />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={handleEditBell}>
              <FontAwesomeIcon icon={faEdit} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="items-center space-y-1.5">
            <Text className="text-[72px] font-bold text-white">
              {bell?.time || 'Unknown'}
            </Text>
            <Text className="text-2xl font-semibold text-white">
              {bell?.day
                ? dayList.find(v => v.id === bell.day)?.label
                : 'Unknown'}
            </Text>
          </View>
        </View>
        <View className="min-h-[70vh]">
          <View className="p-4">
            <View>
              <View className="flex-1 justify-center space-y-1.5">
                <Text className="text-lg font-medium" numberOfLines={2}>
                  {bell?.name}
                </Text>
                <View className="space-y-1">
                  <View className="flex-row space-x-1.5 items-center">
                    <FontAwesomeIcon color="#A9A9A9" size={14} icon={faMusic} />
                    <Text>{bell?.audio?.name || 'Unknown'}</Text>
                  </View>
                  <View className="flex-row space-x-1.5 items-center">
                    <FontAwesomeIcon color="#A9A9A9" size={14} icon={faClock} />
                    <Text>
                      {bell?.createdAt
                        ? moment(bell.createdAt).format('DD/MM/YY HH:mm')
                        : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View className="p-4 justify-center pt-14">
            <View className="space-y-24">
              <View className="-ml-3.5 -mr-4">
                <Slider
                  minimumValue={1}
                  maximumValue={100}
                  minimumTrackTintColor="#FFDB4C"
                  maximumTrackTintColor="#939393"
                  thumbTintColor="#FFDB4C"
                  disabled={isAlarmRinging}
                  value={
                    isAlarmRinging
                      ? 0
                      : (progressTrack.position / progressTrack.duration) * 100
                  }
                  onSlidingComplete={handleOnSeek}
                />
                <View className="justify-between flex-row px-4">
                  <Text>
                    {seconds2time(isAlarmRinging ? 0 : progressTrack.position)}
                  </Text>
                  <Text>
                    {seconds2time(
                      isAlarmRinging
                        ? progressTrack.duration
                        : progressTrack.duration - progressTrack.position,
                    )}
                  </Text>
                </View>
              </View>
              <View className="justify-center items-center">
                <TouchableWithoutFeedback onPress={handleOnPlay}>
                  <View className="p-8 animate-bounce rounded-2xl shadow-md shadow-slate-300 bg-white">
                    {
                      {
                        play: (
                          <FontAwesomeIcon
                            color="#939393"
                            icon={faBell}
                            size={128}
                          />
                        ),
                        pause: (
                          <FontAwesomeIcon
                            color="#939393"
                            icon={faBellSlash}
                            size={128}
                          />
                        ),
                      }[isPlay ? 'pause' : 'play']
                    }
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      {isDeleteBell && (
        <>
          <View className="w-full h-full absolute bg-[#00000050]" />
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={['25%', '25%']}
            enablePanDownToClose
            onClose={() => setIsDeleteBell(false)}
            style={{
              backgroundColor: 'white',
              borderRadius: 24,
              shadowColor: '#000000',
              shadowOffset: {
                width: 0,
                height: 8,
              },
              shadowOpacity: 1,
              shadowRadius: 24,
              elevation: 10,
            }}>
            <View className="w-full">
              {
                {
                  CANT_DELETE: (
                    <View className="p-4 h-full">
                      <View className="space-y-1.5 flex-1">
                        <Text className="text-lg font-semibold">
                          Oups, tidak bisa menghapus!.
                        </Text>
                        <Text numberOfLines={2} className="text-base">
                          Kamu tidak bisa menghapus bel ketika ada yang
                          berdering.
                        </Text>
                      </View>
                      <View>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setIsDeleteBell(false)}
                          className="bg-yellow-500 p-4 rounded-full shadow shadow-slate-100">
                          <Text className="text-white font-bold text-base text-center">
                            Keluar
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ),
                  CAN_DELETE: (
                    <View className="p-4 h-full">
                      <View className="space-y-1.5 flex-1">
                        <Text className="text-lg font-semibold">
                          Konfirmasi Hapus
                        </Text>
                        <Text numberOfLines={2} className="text-base">
                          Apakah Kamu yakin akan menghapus "
                          {
                            // eslint-disable-next-line prettier/prettier
                            `${bell?.name} (${dayList.find(v => v.id === (bell?.day as string))?.label}, ${bell?.time}:00)`
                          }
                          "
                        </Text>
                      </View>
                      <View className="flex-row justify-between">
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setIsDeleteBell(false)}
                          className="bg-yellow-500 p-4 rounded-full shadow shadow-slate-100 w-[26vh]">
                          <Text className="text-white font-bold text-base text-center">
                            Batal
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={handleDeleteData}
                          className="bg-red-400 p-4 rounded-full shadow shadow-slate-100 w-[16vh]">
                          <Text className="text-white font-bold text-base text-center">
                            Hapus
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ),
                }[!isAlarmRinging ? 'CAN_DELETE' : 'CANT_DELETE']
              }
            </View>
          </BottomSheet>
        </>
      )}
    </View>
  );
};

export default BellDetailScreen;
