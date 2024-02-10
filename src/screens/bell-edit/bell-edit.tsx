/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/native';
import {
  FC,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import React, {
  FlatList,
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  AudioProps,
  AudioNameProps as BellNameProps,
  BellProps,
  AudioNameProps as TimeProps,
} from './../../types';
import {
  faClock,
  faFolder,
  faMusic,
  faPlayCircle,
} from '@fortawesome/free-solid-svg-icons';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { audioSchema, bellSchema } from './../../schemas';
import { createInitial } from '@utils/create-initial';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { seconds2time } from '@utils/seconds2time';
import { bytes2mb } from '@utils/bytes2mb';
import { TextInput } from '@components/text-input';
import { Button } from '@components/button';
import { Card } from '@components/card';
import { days as dayList, channelId } from './../../const';
import { nextTime } from '@utils/next-time';
import { uppercaseFirst } from '@utils/uppercase-first';
import DatePicker from 'react-native-date-picker';
import BottomSheet from '@gorhom/bottom-sheet';
import Realm from 'realm';
import moment from 'moment';
import Toast from 'react-native-toast-message';

const DATA = dayList;
const CHANNEL_ID = channelId;

type TempSelectedAudioProps = {
  value: {
    key?: string;
    name: string;
    path: string;
  };
  error?: string;
};

type RouteParams = {
  bellKey: string;
};

const BellEditScreen = () => {
  const route = useRoute();
  const { bellKey } = route.params as RouteParams;

  const navigation = useNavigation();

  const [bellName, setBellName] = useState<BellNameProps>({ value: '' });
  const [audios, setAudios] = useState<AudioProps[]>([]);
  const [tempSelectError, setTempSelectError] = useState('');
  const [tempSelectedTime, setTempSelectedTime] = useState<TimeProps>({
    value: '',
  });
  const [isShowDatePicker, setIsShowDatePicker] = useState(false);
  const [isShowAudioPicker, setIsShowAudioPicker] = useState(false);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['35%', '35%'], []);
  const [tempDateSelect, setTmpDateSelect] = useState<Date>(new Date());
  const [tempSelectedAudio, setTempSelectedAudio] =
    useState<TempSelectedAudioProps>({
      value: { key: '', name: '', path: '' },
    });

  const handleFetchData = async () => {
    const realm = await Realm.open({
      schema: [bellSchema],
      path: 'bell.realm',
    });
    const realm2 = await Realm.open({
      schema: [audioSchema],
      path: 'audio.realm',
    });
    try {
      const result = realm
        .objects<BellProps>('Bell')
        .find(item => item.key === bellKey);
      if (result) {
        const audio = realm2
          .objects<AudioProps>('Audio')
          .find(item => item.key === result.audioKey);

        setBellName({ value: result.name });
        setTempSelectedTime({ value: result.time });
        setTempSelectedAudio({
          value: {
            name: audio?.name || 'unknown',
            key: audio?.key || undefined,
            path: audio?.path as string,
          },
        });
        navigation.setOptions({
          title: `Ubah Bel: ${dayList.find(v => v.id === result.day)?.label}`,
        });
      }

      const storedAudio = realm2
        .objects<AudioProps>('Audio')
        .sorted('createdAt', true);
      if (storedAudio) {
        setAudios(Array.from(storedAudio));
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

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await handleFetchData();
      })();
    }, []),
  );

  const handleOnSave = async () => {
    let status = true;
    if (!bellName.value) {
      setBellName({ error: 'This field is required', value: '' });
      status = false;
    }
    if (!tempSelectedTime.value) {
      setTempSelectedTime({ error: 'This field is required', value: '' });
      status = false;
    }
    if (!tempSelectedAudio.value.name) {
      setTempSelectedAudio({
        error: 'This field is required',
        value: { name: '', key: '', path: '' },
      });
      status = false;
    }

    if (!status) {
      return;
    }
    const realm = await Realm.open({
      schema: [bellSchema],
      path: 'bell.realm',
    });
    try {
      const result = realm
        .objects<BellProps>('Bell')
        .find(item => item.key === bellKey);
      if (result) {
        realm.write(() => {
          result.name = bellName.value;
          result.time = tempSelectedTime.value;
          result.audioKey = tempSelectedAudio.value.key as string;
        });

        const trigger: TimestampTrigger = {
          type: TriggerType.TIMESTAMP,
          timestamp: nextTime(`${result.day}, ${result.time}`),
          repeatFrequency: RepeatFrequency.WEEKLY,
          alarmManager: true,
        };

        const alarm = await notifee.createTriggerNotification(
          {
            id: result.key,
            title: `${result.name}`,
            body: `${dayList.find(v => v.id === result.day)?.label}, at ${result.time}`,
            android: {
              channelId: CHANNEL_ID,
              importance: AndroidImportance.HIGH,
              style: {
                type: AndroidStyle.BIGTEXT,
                text: `<b>${dayList.find(v => v.id === result.day)?.label}, at ${result.time}</b><br/>Pastikan aplikasi bel terbuka/ dalam mode minimize agar suara bel berbunyi.`,
                title: `${result.name}`,
              },
            },
            data: {
              type: 'trigger',
            },
          },
          trigger,
        );

        if (!alarm) {
          throw new Error();
        }
        navigation.goBack();
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam menyimpan data!',
        position: 'bottom',
      });
    }
  };

  useEffect(() => {
    if (isShowDatePicker && !tempSelectedTime.value) {
      setTempSelectedTime({ value: moment().format('HH:mm') });
    }
  }, [isShowDatePicker]);

  const handleOnPress = (name: string, key: string, path: string) => {
    setTempSelectedAudio(() => {
      setIsShowAudioPicker(false);
      return {
        value: {
          name,
          key,
          path,
        },
      };
    });
  };

  return (
    <Fragment>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="bg-white">
        <View className="mx-4 space-y-4 my-4">
          <TextInput
            value={bellName.value}
            onChangeText={value => setBellName({ value: value })}
            placeholder="Nama Bel"
            error={bellName.error}
          />
          <View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setIsShowAudioPicker(true);
              }}>
              <Card className="border border-slate-200 rounded-lg p-4 py-[18px] flex-row space-x-2 justify-center items-center">
                <View className="flex-1 space-y-2">
                  <Text className="font-bold text-slate-400">
                    {(tempSelectedAudio && tempSelectedAudio.value.name) ||
                      'Pilih Satu'}
                  </Text>
                </View>
                <View className="justify-center">
                  <FontAwesomeIcon color="#b1b1b1" size={20} icon={faMusic} />
                </View>
              </Card>
            </TouchableOpacity>
            {tempSelectedAudio.error && (
              <Text className="text-red-400 mt-0.5">
                {tempSelectedAudio.error}
              </Text>
            )}
          </View>
          <View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setIsShowDatePicker(true);
              }}>
              <Card className="border border-slate-200 rounded-lg p-4 py-[18px] flex-row space-x-2 justify-center items-center">
                <View className="flex-1 space-y-2">
                  <Text className="font-bold text-slate-400">
                    {tempSelectedTime.value || 'Pilih satu'}
                  </Text>
                </View>
                <View className="justify-center">
                  <FontAwesomeIcon color="#b1b1b1" size={20} icon={faClock} />
                </View>
              </Card>
            </TouchableOpacity>
            {tempSelectedTime.error && (
              <Text className="text-red-400 mt-0.5">{bellName.error}</Text>
            )}
          </View>
        </View>
        <View className="h-[200]">
          {tempSelectError && (
            <Text className="text-red-400 mx-4 pt-2">{tempSelectError}</Text>
          )}
          <View className="pt-8 mx-4">
            <Button onPress={handleOnSave}>Simpan Bel</Button>
          </View>
        </View>
      </ScrollView>
      {isShowDatePicker && (
        <>
          <View className="w-full h-full absolute bg-[#00000050]" />
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose
            onClose={() => setIsShowDatePicker(false)}
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
            <View className="h-full justify-center items-center px-4 pb-4">
              <DatePicker
                mode="time"
                minuteInterval={1}
                open
                date={moment(
                  `${moment().format('YYYY-MM-DD')}T${moment(
                    tempDateSelect,
                  ).format('HH:mm')}`,
                ).toDate()}
                onDateChange={date => {
                  setTmpDateSelect(date);
                }}
                onCancel={() => {
                  setIsShowDatePicker(false);
                }}
              />
              <View className="w-full">
                <TouchableWithoutFeedback
                  onPress={() => {
                    setTempSelectedTime({
                      value: moment(tempDateSelect).format('HH:mm'),
                    });
                    setIsShowDatePicker(false);
                  }}>
                  <View className=" bg-yellow-500 p-4 rounded-full shadow shadow-slate-100">
                    <Text className="text-white font-bold text-base text-center">
                      Select Time
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>
            </View>
          </BottomSheet>
        </>
      )}
      {isShowAudioPicker && (
        <>
          <View className="w-full h-full absolute bg-[#00000050]" />
          <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={['60%', '99%']}
            enablePanDownToClose
            onClose={() => setIsShowAudioPicker(false)}
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
            <View>
              <FlatList
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                ListHeaderComponent={<View className="h-5" />}
                data={audios || []}
                renderItem={({ item }) => (
                  <AudioItem
                    onPress={() => handleOnPress(item.name, item.key, item.path)}
                    title={item.name}
                    duration={item.duration}
                    date={item.createdAt}
                    size={item.size}
                  />
                )}
                keyExtractor={item => item.key}
                ItemSeparatorComponent={() => {
                  return <View className="h-4" />;
                }}
                ListFooterComponent={<View className="h-[100]" />}
              />
            </View>
          </BottomSheet>
        </>
      )}
    </Fragment>
  );
};

type ItemProps = {
  onPress: () => void;
  selected: (typeof DATA)[number]['label'][];
  title: string;
};

const Item: FC<ItemProps> = props => {
  const { title, selected, onPress } = props;

  const tempClassName = [
    'flex-1 space-x-3 shadow-md shadow-slate-300 mx-4 rounded-2xl py-5 px-4 flex-row border border-slate-100 bg-white',
  ];
  if (selected.includes(title)) {
    tempClassName.push('border border-yellow-500 bg-yellow-50');
  }

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View className={tempClassName.join(' ')}>
        <View className="h-12 w-12 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-300">
          <Text className="text-xl font-bold text-slate-500">
            {createInitial(title)}
          </Text>
        </View>
        <View className="flex-1 justify-center space-y-0.5">
          <Text className="text-base font-medium" numberOfLines={1}>
            {title}
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

type AudioItemProps = {
  onPress: () => void;
  title: string;
  date: Date;
  duration: number;
  size: number;
};

const AudioItem: FC<AudioItemProps> = props => {
  const { title, date, duration, size, onPress } = props;

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View className="bg-white space-x-3 shadow-md shadow-slate-300 mx-4 rounded-2xl py-5 px-4 flex-row border border-slate-100">
        <View className="h-12 w-12 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-300">
          <Text className="text-2xl font-bold text-slate-500">S</Text>
        </View>
        <View className="flex-1 justify-center space-y-0.5">
          <Text className="text-base font-medium" numberOfLines={1}>
            {title}
          </Text>
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
      </View>
    </TouchableWithoutFeedback>
  );
};

export default BellEditScreen;
