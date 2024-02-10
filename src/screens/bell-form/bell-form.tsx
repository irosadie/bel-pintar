/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import React, {
  FlatList,
  Text,
  View,
  TouchableWithoutFeedback,
} from 'react-native';
import {
  AudioProps,
  AudioNameProps as BellNameProps,
  AudioNameProps as TimeProps,
} from './../../types';
import { TextInput } from 'react-native-paper';
import {
  faClock,
  faFolder,
  faMusic,
  faPlayCircle,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { dayActiveSchema, audioSchema, bellSchema } from './../../schemas';
import { DayActiveProps } from 'src/types/day-active';
import { createInitial } from '@utils/create-initial';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { seconds2time } from '@utils/seconds2time';
import { bytes2mb } from '@utils/bytes2mb';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  RepeatFrequency,
  TimestampTrigger,
  TriggerType,
} from '@notifee/react-native';
import { Card } from '@components/card';
import { generateRandomString } from '@utils/random-string';
import { dayKey, days } from './../../const';
import { NoData } from '@components/no-data';
import { Button } from '@components/button';
import { days as dayList, channelId } from './../../const';
import Toast from 'react-native-toast-message';
import DatePicker from 'react-native-date-picker';
import BottomSheet from '@gorhom/bottom-sheet';
import Realm from 'realm';
import moment from 'moment';
import { nextTime } from '@utils/next-time';

const CHANNEL_ID = channelId;
const DATA = days;
const KEY = dayKey;

type TempSelectedAudioProps = {
  value: {
    key: string;
    name: string;
  };
  error?: string;
};

const BellFormScreen = () => {
  const navigation: any = useNavigation();

  const [bellName, setBellName] = useState<BellNameProps>({ value: '' });
  const [dayActives, setDayActives] = useState<typeof DATA>([]);
  const [audios, setAudios] = useState<AudioProps[]>([]);
  const [tempSelect, setTempSelect] = useState<
    (typeof DATA)[number]['label'][]
  >([]);
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
    useState<TempSelectedAudioProps>({ value: { key: '', name: '' } });

  const handleAddVoice = () => {
    return navigation.navigate('Master Sound');
  };

  const handleFetchData = async () => {
    const realm = await Realm.open({
      schema: [dayActiveSchema],
      path: 'dayActive.realm',
    });

    const realm2 = await Realm.open({
      schema: [audioSchema],
      path: 'audio.realm',
    });

    try {
      const storedAudio = realm2
        .objects<AudioProps>('Audio')
        .sorted('createdAt', true);
      if (storedAudio) {
        setAudios(Array.from(storedAudio));
      }

      const storedDayActive = realm
        .objects<DayActiveProps>('Day Active')
        .find(item => {
          return item.key === KEY;
        });
      if (storedDayActive) {
        setDayActives(() => {
          const tempActiveDays = [];
          if (storedDayActive.monday) {
            tempActiveDays.push(DATA[0]);
          }
          if (storedDayActive.tuesday) {
            tempActiveDays.push(DATA[1]);
          }
          if (storedDayActive.wednesday) {
            tempActiveDays.push(DATA[2]);
          }
          if (storedDayActive.thursday) {
            tempActiveDays.push(DATA[3]);
          }
          if (storedDayActive.friday) {
            tempActiveDays.push(DATA[4]);
          }
          if (storedDayActive.saturday) {
            tempActiveDays.push(DATA[5]);
          }
          if (storedDayActive.sunday) {
            tempActiveDays.push(DATA[6]);
          }
          return tempActiveDays;
        });
      }
    } catch (error) {
      console.log('error saat ambil data', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await handleFetchData();
      })();
    }, []),
  );

  const handleOnSelect = (day: (typeof DATA)[number]['id']) => {
    setTempSelect(prevData => {
      if (prevData.includes(day)) {
        return prevData.filter(v => v !== day);
      }
      return [...prevData, day];
    });
  };

  const handleOnSave = async () => {
    let status = true;
    if (!bellName.value) {
      setBellName({ error: 'This field is required', value: '' });
      status = false;
    }
    if (tempSelect.length <= 0) {
      setTempSelectError('This field is required');
      status = false;
    }
    if (!tempSelectedTime.value) {
      setTempSelectedTime({ error: 'This field is required', value: '' });
      status = false;
    }
    if (!tempSelectedAudio.value.name) {
      setTempSelectedAudio({
        error: 'This field is required',
        value: { name: '', key: '' },
      });
      status = false;
    }

    if (!status) {
      return;
    }

    let realm: Realm | null = null;

    try {
      realm = await Realm.open({
        schema: [bellSchema],
        path: 'bell.realm',
      });

      const realmAudio = await Realm.open({
        path: 'audio.realm',
        schema: [audioSchema],
      });

      // const result = realmAudio
      //   .objects<AudioProps>('Audio')
      //   .find(item => item.key === tempSelectedAudio.value.key);

      realm.write(() => {
        tempSelect.forEach(async value => {
          const id = generateRandomString();
          realm?.create('Bell', {
            key: id,
            name: bellName.value,
            day: value,
            time: tempSelectedTime.value,
            audioKey: tempSelectedAudio.value.key,
            createdAt: new Date(),
          });

          const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: nextTime(`${value}, ${tempSelectedTime.value}`),
            repeatFrequency: RepeatFrequency.WEEKLY,
            alarmManager: true,
          };

          const alarm = await notifee.createTriggerNotification(
            {
              id,
              title: `${bellName.value}`,
              body: `${dayList.find(v => v.id === value)?.label}, at ${tempSelectedTime.value}`,
              android: {
                channelId: CHANNEL_ID,
                importance: AndroidImportance.HIGH,
                style: {
                  type: AndroidStyle.BIGTEXT,
                  text: `<b>${dayList.find(v => v.id === value)?.label}, at ${tempSelectedTime.value}</b><br/>Pastikan aplikasi bel terbuka/ dalam mode minimize agar suara bel berbunyi.`,
                  title: `${bellName.value}`,
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
        });
      });
    } catch (error) {
      realm?.cancelTransaction();
      Toast.show({
        type: 'error',
        text1: 'Ops!',
        text2: 'Error saat membuat bell, ulangi lagi!',
        position: 'bottom',
        bottomOffset: 40,
      });
    }
  };

  useEffect(() => {
    if (tempSelect.length > 0) {
      setTempSelectError('');
    }
  }, [tempSelect.length]);

  useEffect(() => {
    if (isShowDatePicker && !tempSelectedTime.value) {
      setTempSelectedTime({ value: moment().format('HH:mm') });
    }
  }, [isShowDatePicker]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Tambah Bel Baru',
    });
  }, []);

  const handleOnPress = (name: string, key: string) => {
    setTempSelectedAudio(() => {
      setIsShowAudioPicker(false);
      return {
        value: {
          name,
          key,
        },
      };
    });
  };

  const handleOnDayActivePress = () => navigation.navigate('Day Active');

  return (
    <View className="bg-white h-[100%]">
      <FlatList
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mx-4 space-y-4 my-4">
            <View className="flex-1 min-h-[60px]">
              <TextInput
                activeUnderlineColor="transparent"
                underlineColor="transparent"
                placeholder="Nama Bel"
                className="bg-slate-50 rounded-xl border border-slate-300"
                placeholderTextColor="#B0B0B0"
                onChangeText={value => setBellName({ value: value })}
              />
              {bellName.error && (
                <Text className="text-red-400 mt-0.5">{bellName.error}</Text>
              )}
            </View>
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
                        'Pilih satu'}
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
        }
        numColumns={2}
        data={dayActives}
        renderItem={({ item }) => (
          <Item
            onPress={() => handleOnSelect(item.id)}
            title={item.label}
            id={item.id}
            selected={tempSelect}
          />
        )}
        keyExtractor={item => item.id}
        ItemSeparatorComponent={() => {
          return <View className="h-4" />;
        }}
        ListEmptyComponent={
          <TouchableOpacity activeOpacity={0.8} onPress={handleOnDayActivePress}>
            <View className="flex-1 space-x-3 shadow-md shadow-slate-300 mx-4 rounded-2xl py-5 px-4 flex-row border border-slate-200 bg-white">
              <View className="flex-1 justify-center space-y-0.5">
                <Text className="text-base" numberOfLines={2}>
                  Belum menambahkan hari akti belajar, klik disini untuk menambahkan.
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        }
        ListFooterComponent={
          <View className="h-[200]">
            {tempSelectError && (
              <Text className="text-red-400 mx-4 pt-2">{tempSelectError}</Text>
            )}
            <View className="pt-8 mx-4">
              <TouchableWithoutFeedback onPress={handleOnSave}>
                <View className=" bg-yellow-500 p-4 rounded-full shadow shadow-slate-100">
                  <Text className="text-white font-bold text-base text-center">
                    Simpan Bel
                  </Text>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </View>
        }
      />
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
                    onPress={() => handleOnPress(item.name, item.key)}
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
                ListEmptyComponent={
                  <View>
                    <NoData
                      title="Belum ada suara nih!"
                      description="Yuk upload suara dulu dengan menekan tombol dibawah."
                    />
                    <View className="px-4">
                      <Button onPress={handleAddVoice}>Tambah Suara</Button>
                    </View>
                  </View>
                }
              />
            </View>
          </BottomSheet>
        </>
      )}
    </View>
  );
};

type ItemProps = {
  onPress: () => void;
  selected: (typeof DATA)[number]['id'][];
  title: string;
  id: string;
};

const Item: FC<ItemProps> = props => {
  const { title, id, selected, onPress } = props;

  const tempClassName = [
    'flex-1 space-x-3 shadow-md shadow-slate-300 mx-4 rounded-2xl py-5 px-4 flex-row border border-slate-100 bg-white',
  ];
  if (selected.includes(id)) {
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

export default BellFormScreen;
