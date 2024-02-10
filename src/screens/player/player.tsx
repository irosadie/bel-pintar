/* eslint-disable prettier/prettier */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react-hooks/exhaustive-deps */
import {
  faArrowLeft,
  faBell,
  faBellSlash,
  faClock,
  faEdit,
  faFolder,
  faPlayCircle,
  faRotateRight,
  faTrashAlt,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { useNavigation, useRoute } from '@react-navigation/native';
import { bytes2mb } from '@utils/bytes2mb';
import moment from 'moment';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  TouchableWithoutFeedback,
  AppState,
} from 'react-native';
import { audioSchema, bellSchema } from './../../schemas';
import { AudioNameProps, AudioProps, BellProps } from './../../types';
import BottomSheet from '@gorhom/bottom-sheet';
import { TextInput } from 'react-native-paper';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import { seconds2time } from '@utils/seconds2time';
import { getAudioDuration } from '@utils/audio-duration';
import Slider from '@react-native-community/slider';
import { createInitial } from '@utils/create-initial';
import { TouchableOpacity } from 'react-native-gesture-handler';
import TrackPlayer, {
  State,
  Event,
  useProgress,
  useTrackPlayerEvents,
  Track,
} from 'react-native-track-player';
import { Card } from '@components/card';
import _debounce from 'lodash/debounce';
import Toast from 'react-native-toast-message';
import { isShowPlayingCard } from './../../stores/atom';
import { useRecoilState } from 'recoil';

type RouteParams = {
  audioKey: string;
};

const PlayerScreen = () => {
  const route = useRoute();
  const { audioKey } = route.params as RouteParams;

  const navigation: any = useNavigation();

  const [audio, setAudio] = useState<AudioProps>();
  const [selectedFile, setSelectedFile] =
    useState<DocumentPickerResponse | null>(null);
  const [isEditAudio, setIsEditAudio] = useState(false);
  const [isDeleteAudio, setIsDeleteAudio] = useState(false);
  const [audioName, setAudioName] = useState<AudioNameProps>({ value: '' });
  const [isFetchData, setIsFetchData] = useState(false);
  const [isPlay, setPlay] = useState(false);
  const [isCanDelete, setIsCanDelete] = useState(false);
  const [tempTrack, setTempTrack] = useState<Track>();
  const [isPlayingCard] = useRecoilState(isShowPlayingCard);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['38%', '38%'], []);

  const progressTrack = useProgress(1);

  const isAlarmRinging = isPlayingCard.notification && isPlayingCard.playing;

  const handleFetchData = async () => {
    try {
      const realm = await Realm.open({
        path: 'audio.realm',
        schema: [audioSchema],
      });
      const realm2 = await Realm.open({
        path: 'bell.realm',
        schema: [bellSchema],
      });
      const result = realm
        .objects<AudioProps>('Audio')
        .find(item => item.key === audioKey);
      if (!result) {
        throw new Error('');
      }

      // looking for bell who used this audio
      const checkAudioResult = realm2
        .objects<BellProps>('Bell')
        .find(item => item.audioKey === result.key);
      if (!checkAudioResult) {
        setIsCanDelete(true);
      }

      setAudio(result);
      setAudioName({ value: result.name || '', error: undefined });

      const track = {
        id: `${Math.random() + moment().unix()}`,
        url: result.path,
        title: result.name ?? '',
        artist: result.name ?? '',
        loop: false,
      };

      if (!isAlarmRinging) {
        await TrackPlayer.reset();
        await TrackPlayer.add(track);
      }
      else {
        setTempTrack(track);
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

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.audio],
        allowMultiSelection: false,
      });
      setSelectedFile(result[0]);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        setSelectedFile(null);
      } else {
        throw err;
      }
    }
  };

  const handleSaveEditData = async () => {
    if (!audioName.value) {
      return setAudioName(prevData => {
        return { ...prevData, error: 'this field is required' };
      });
    }
    if (selectedFile) {
      const pathDir = RNFS.DocumentDirectoryPath;
      try {
        const realm = await Realm.open({
          path: 'audio.realm',
          schema: [audioSchema],
        });
        // eslint-disable-next-line prettier/prettier
        const fileName = `${pathDir}/audio/${moment().unix()}___title_${selectedFile.name}`;
        await RNFS.copyFile(selectedFile.uri, fileName);
        const duration = await getAudioDuration(fileName);

        const result = realm
          .objects<AudioProps>('Audio')
          .find(item => item.key === audioKey);
        if (!result) {
          throw new Error('');
        }
        RNFS.unlink(result.path);
        realm.write(() => {
          result.path = fileName;
          result.duration = duration;
          result.name = audioName.value;
        });
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: 'Kesalahan',
          text2: 'Kesalahan dalam menyimpan data!',
          position: 'bottom',
        });
      }
    }
    setSelectedFile(null);
    setIsFetchData(prevData => !prevData);
    setIsEditAudio(false);
  };

  const handleDeleteData = async () => {
    const realm = await Realm.open({
      path: 'audio.realm',
      schema: [audioSchema],
    });

    const result = realm
      .objects<AudioProps>('Audio')
      .find(item => item.key === audioKey);
    if (result) {
      RNFS.unlink(result.path);
      realm.write(() => {
        realm.delete(result);
      });
      navigation.goBack();
    }
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

  const handleOnSeek = _debounce((value: number) => {
    if (isAlarmRinging) {
      return;
    }
    TrackPlayer.seekTo(
      convertPercentageToSeconds(value, progressTrack.duration),
    );
  }, 750);

  useEffect(() => {
    handleFetchData();
  }, [isFetchData]);

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

  const convertName = (name: string) => {
    const splitName = name.split('___title_');
    return splitName.length <= 1 ? name : splitName[1];
  };

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

  return (
    <View className="flex-1">
      <ScrollView className="flex-1 bg-slate-50 pb-12 h-full">
        <View className="h-[30vh] bg-yellow-400 items-center justify-end pb-6">
          <View className="absolute top-3 left-4 bg-slate-50 rounded-full p-2 shadow shadow-slate-300">
            <TouchableOpacity onPress={handleGoBack} className="bg-transparent">
              <FontAwesomeIcon icon={faArrowLeft} size={20} color="#b2b2b2" />
            </TouchableOpacity>
          </View>
          <View className="absolute top-5 right-5 flex-row gap-6">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsDeleteAudio(true)}>
              <FontAwesomeIcon
                icon={faTrashAlt}
                size={22}
                color="#fff"
                style={{ top: 1 }}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsEditAudio(true)}>
              <FontAwesomeIcon icon={faEdit} size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View className="items-center">
            <Text className="text-8xl font-semibold text-white">
              {createInitial(audio?.name || 'Unknown')}
            </Text>
          </View>
        </View>
        <View className="min-h-[70vh]">
          <View className="p-4">
            <View>
              <View className="flex-1 justify-center space-y-1.5">
                <Text className="text-lg font-medium" numberOfLines={2}>
                  {audio?.name}
                </Text>
                <View className="flex-row space-x-3">
                  <View className="flex-row space-x-1 items-center">
                    <FontAwesomeIcon color="#A9A9A9" size={14} icon={faClock} />
                    <Text>
                      {audio?.createdAt
                        ? moment(audio.createdAt).format('DD/MM/YY HH:mm')
                        : '-'}
                    </Text>
                  </View>
                  <View className="flex-row space-x-1 items-center">
                    <FontAwesomeIcon
                      color="#A9A9A9"
                      size={14}
                      icon={faPlayCircle}
                    />
                    <Text>{seconds2time(audio?.duration || 0)}</Text>
                  </View>
                  <View className="flex-row space-x-1 items-center">
                    <FontAwesomeIcon
                      color="#A9A9A9"
                      size={14}
                      icon={faFolder}
                    />
                    <Text>{bytes2mb(audio?.size || 0)} MB</Text>
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
      {isEditAudio && (
        <>
          <View className="w-full h-full absolute bg-[#00000050]" />
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={() => setIsEditAudio(false)}
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
            <View className="w-full h-full">
              <View className="p-4 space-y-4 h-full">
                <Card className="border border-slate-200 rounded-lg p-4 flex-row space-x-2 justify-center">
                  <View className="flex-1 space-y-2">
                    <Text numberOfLines={2}>
                      {
                        // eslint-disable-next-line prettier/prettier
                        convertName(selectedFile ? (selectedFile.name || '') : audio?.path.split('/files/')[1] || '')
                      }
                    </Text>
                    <Text className="font-bold">
                      {selectedFile
                        ? `${bytes2mb(selectedFile.size || 0)}MB`
                        : `${bytes2mb(audio?.size || 0)}MB`}
                    </Text>
                  </View>
                  <View className="justify-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handlePickDocument}
                      className="p-2 rounded-full bg-slate-200 border border-slate-300">
                      <FontAwesomeIcon
                        color="#b1b1b1"
                        size={20}
                        icon={faRotateRight}
                      />
                    </TouchableOpacity>
                  </View>
                </Card>
                <View className="flex-1 min-h-[80px]">
                  <TextInput
                    activeUnderlineColor="transparent"
                    underlineColor="transparent"
                    placeholder="Nama Suara"
                    className="bg-slate-50 rounded-xl border border-slate-300"
                    placeholderTextColor="#B0B0B0"
                    onChangeText={value => setAudioName({ value: value })}
                    value={audioName?.value}
                  />
                  {audioName.error && (
                    <Text className="text-red-400">{audioName.error}</Text>
                  )}
                </View>
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setIsEditAudio(false)}
                    className="bg-slate-400 p-4 rounded-full shadow shadow-slate-100 w-[16vh]">
                    <Text className="text-white font-bold text-base text-center">
                      Batal
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleSaveEditData}
                    className="bg-yellow-500 p-4 rounded-full shadow shadow-slate-100 w-[26vh]">
                    <Text className="text-white font-bold text-base text-center">
                      Simpan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BottomSheet>
        </>
      )}
      {isDeleteAudio && (
        <>
          <View className="w-full h-full absolute bg-[#00000050]" />
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={['25%', '25%']}
            enablePanDownToClose
            onClose={() => setIsDeleteAudio(false)}
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
              {{
                CAN_DELETE: (
                  <View className="p-4 h-full">
                    <View className="space-y-1.5 flex-1">
                      <Text className="text-lg font-semibold">
                        Konfirmasi Hapus
                      </Text>
                      <Text numberOfLines={2} className="text-base">
                        Apakah Kamu yakin akan menghapus "{audio?.name}"
                      </Text>
                    </View>
                    <View className="flex-row justify-between">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsDeleteAudio(false)}
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
                CANT_DELETE: (
                  <View className="p-4 h-full">
                    <View className="space-y-1.5 flex-1">
                      <Text className="text-lg font-semibold">
                        Oups, tidak bisa menghapus!.
                      </Text>
                      <Text numberOfLines={2} className="text-base">
                        "{audio?.name}" masih digunakan di Bel yang aktif.
                      </Text>
                    </View>
                    <View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsDeleteAudio(false)}
                        className="bg-yellow-500 p-4 rounded-full shadow shadow-slate-100">
                        <Text className="text-white font-bold text-base text-center">
                          Keluar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ),
              }[isCanDelete ? 'CAN_DELETE' : 'CANT_DELETE']}
            </View>
          </BottomSheet>
        </>
      )}
    </View>
  );
};

export default PlayerScreen;
