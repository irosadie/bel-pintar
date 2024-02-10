/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React, {
  Text,
  View,
  FlatList,
  TouchableWithoutFeedback,
} from 'react-native';
import Realm from 'realm';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import BottomSheet from '@gorhom/bottom-sheet';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faAdd,
  faClock,
  faClose,
  faFolder,
  faPlayCircle,
} from '@fortawesome/free-solid-svg-icons';
import { TextInput } from 'react-native-paper';
import { bytes2mb } from '@utils/bytes2mb';
import moment from 'moment';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { audioSchema } from './../../schemas';
import { AudioNameProps, AudioProps } from './../../types';
import { seconds2time } from '@utils/seconds2time';
import { getAudioDuration } from '@utils/audio-duration';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { generateRandomString } from '@utils/random-string';
import { NoData } from '@components/no-data';
import { Card } from '@components/card';
import { Button } from '@components/button';
import Toast from 'react-native-toast-message';
import { CardItem } from '@components/card-item';

const MasterSoundScreen = () => {
  const [audioName, setAudioName] = useState<AudioNameProps>({ value: '' });
  const [selectedFile, setSelectedFile] =
    useState<DocumentPickerResponse | null>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['40%', '40%'], []);
  const [audios, setAudios] = useState<AudioProps[]>([]);

  const navigation: any = useNavigation();

  const setupRealm = async (
    name: string,
    path: string,
    duration: number,
    audio = selectedFile,
  ) => {
    const realm = await Realm.open({
      path: 'audio.realm',
      schema: [audioSchema],
    });
    try {
      realm.write(() => {
        const newAudioSchema: AudioProps = {
          key: generateRandomString(),
          name: name,
          path: path,
          duration: duration,
          type: audio?.type || '',
          size: audio?.size || 0,
          createdAt: new Date(),
        };
        realm.create('Audio', newAudioSchema);
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam menyimpan data!',
        position: 'bottom',
      });
    }
  };

  const handleFetchData = async () => {
    try {
      const realm = await Realm.open({
        path: 'audio.realm',
        schema: [audioSchema],
      });
      const storedAudio = realm
        .objects<AudioProps>('Audio')
        .sorted('createdAt', true);
      setAudios(Array.from(storedAudio));
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
      } else {
        throw err;
      }
    }
  };

  const handleSaveFileToExternalStorage = async () => {
    if (!selectedFile) {
      return;
    }

    if (!audioName.value) {
      return setAudioName(prevData => {
        return { ...prevData, error: 'this field is required' };
      });
    }

    const pathDir = RNFS.DocumentDirectoryPath + '/audio/';

    try {
      if (!(await RNFS.exists(`${pathDir}`))) {
        await RNFS.mkdir(`${pathDir}`);
      }
      // eslint-disable-next-line prettier/prettier
      const fileName = `${pathDir}${moment().unix()}___title_${selectedFile.name}`;
      await RNFS.copyFile(selectedFile.uri, fileName);
      let duration = await getAudioDuration(fileName);
      await setupRealm(audioName.value, fileName, duration);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam menyimpan audio!',
        position: 'bottom',
      });
    }
    setSelectedFile(null);
  };

  useFocusEffect(
    useCallback(() => {
      if (selectedFile === null) {
        handleFetchData();
      }
    }, [selectedFile]),
  );

  useEffect(() => {
    navigation.setOptions({
      title: 'Bank Suara',
    });
  }, []);

  return (
    <View className="bg-slate-50 h-[100%]">
      <FlatList
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={<View className="h-5" />}
        data={audios}
        renderItem={({ item }) => (
          <Item
            key={item.key}
            onPress={() =>
              navigation.navigate('Player', { audioKey: item.key })
            }
            title={item.name}
            duration={item.duration}
            date={item.createdAt}
            size={item.size}
          />
        )}
        keyExtractor={item => item.key}
        ItemSeparatorComponent={() => {
          return <View className="h-5" />;
        }}
        ListEmptyComponent={
          <NoData
            title="Belum ada suara nih!"
            description="Yuk upload suara dulu dengan menekan tombol tambah dibawah."
          />
        }
        ListFooterComponent={<View className="h-5" />}
      />
      {selectedFile ? (
        <>
          <View className="w-full h-full absolute bg-[#00000050]" />
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={() => setSelectedFile(null)}
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
                    <Text numberOfLines={2}>{selectedFile.name}</Text>
                    <Text className="font-bold">
                      {bytes2mb(selectedFile.size || 0)}MB
                    </Text>
                  </View>
                  <View className="justify-center">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setSelectedFile(null)}
                      className="p-2 rounded-full bg-slate-200 border border-slate-300">
                      <FontAwesomeIcon
                        color="#b1b1b1"
                        size={20}
                        icon={faClose}
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
                  />
                  {audioName.error && (
                    <Text className="text-red-400">{audioName.error}</Text>
                  )}
                </View>
                <Button onPress={handleSaveFileToExternalStorage}>
                  Simpan Audio
                </Button>
              </View>
            </View>
          </BottomSheet>
        </>
      ) : (
        <TouchableOpacity activeOpacity={0.8} onPress={handlePickDocument}>
          <View className="absolute p-4 text-white bottom-6 rounded-full right-6 bg-yellow-500 shadow shadow-gray-400">
            <FontAwesomeIcon color="#fff" icon={faAdd} size={24} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

type ItemProps = {
  onPress: () => void;
  title: string;
  date: Date;
  duration: number;
  size: number;
};

const Item: FC<ItemProps> = props => {
  const { title, date, duration, size, onPress } = props;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <CardItem title={title}>
        <View>
          <View className="flex-1 justify-center space-y-0.5">
            <Text className="text-base font-medium" numberOfLines={1}>
              {title}
            </Text>
          </View>
          <View className="flex-row space-x-3">
            <View className="flex-row space-x-1 items-center">
              <FontAwesomeIcon color="#A9A9A9" size={14} icon={faClock} />
              <Text>{moment(date).format('DD/MM/YY HH:mm')}</Text>
            </View>
            <View className="flex-row space-x-1 items-center">
              <FontAwesomeIcon color="#A9A9A9" size={14} icon={faPlayCircle} />
              <Text>{seconds2time(duration)}</Text>
            </View>
            <View className="flex-row space-x-1 items-center">
              <FontAwesomeIcon color="#A9A9A9" size={14} icon={faFolder} />
              <Text>{bytes2mb(size)} MB</Text>
            </View>
          </View>
        </View>
      </CardItem>
    </TouchableWithoutFeedback>
  );
};

export default MasterSoundScreen;
