/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable prettier/prettier */
/* eslint-disable react/no-unstable-nested-components */
import { Card } from '@components/card';
import moment from 'moment';
import { FC, useEffect, useState, memo } from 'react';
import React, {
  ScrollView,
  View,
  Text,
  TouchableWithoutFeedback,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { bellSchema, dayActiveSchema } from './../../schemas';
import { BellProps } from './../../types';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { DayActiveProps } from 'src/types/day-active';
import 'moment/locale/id';
import { isShowPlayingCard } from './../../stores/atom';
import { useRecoilState } from 'recoil';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBell, faTimes } from '@fortawesome/free-solid-svg-icons';
import TrackPlayer from 'react-native-track-player';
import { createInitial } from '@utils/create-initial';
import { dayKey, days } from './../../const';

moment.locale('id');
const KEY = dayKey;

const HomeScreen = () => {
  const navigation: any = useNavigation();

  const [dayStatus, setDayStatus] = useState(false);
  const [, setIsDayActive] = useState(false);
  const [isPlayingCard] = useRecoilState(isShowPlayingCard);
  const [isShowPlayingCardInComponent, setIsShowPlayingCardInComponent] = useState(true);
  const [nearestBell, setNearestBell] = useState<BellProps[]>([]);
  const [time, setTime] = useState('');
  const [futureTime, setFutureTime] = useState<moment.Moment>();
  const [leftTime, setLeftTime] = useState<string>();

  const isFocus = useIsFocused();

  useEffect(() => {
    navigation.setOptions({
      title: 'Beranda',
    });
  }, []);

  const handleAddBell = () => {
    navigation.navigate('Bell Form');
  };

  const handleOnCloseCard = () => {
    setIsShowPlayingCardInComponent(false);
  };

  const handleOnStopBell = () => {
    Alert.alert(
      'Konfirmasi',
      'Bunyi bel akan dihentikan, apakah Anda yakin?.',
      [
        {
          text: 'Yakin',
          onPress: async () => {
            await TrackPlayer.reset();
          },
        },
        {
          text: 'Batal',
          onPress: () => null,
          style: 'cancel',
        },
      ],
      { cancelable: false },
    );
  };

  const handleOnItemPress = (item: BellProps) => {
    navigation.navigate('Bell Detail', { bellKey: item.key });
  };

  const shiftArray = (arr: string[], x: string) => {
    const index = arr.indexOf(x);

    if (index !== -1) {
      const shiftedArray = [...arr.slice(index), ...arr.slice(0, index)];
      return shiftedArray;
    }
    return arr;
  };

  const getDaysInEnglish = (start: string) => {
    const daysArray: string[] = moment.weekdays().map(day => {
      return days.find((item) => item.label.toLowerCase() === day.toLowerCase())?.id as string;
    });
    return shiftArray(daysArray, start);
  };

  const getNearestBellsToday = async () => {
    try {
      const realm = await Realm.open({
        schema: [bellSchema],
        path: 'bell.realm',
      });
      const currentDay = moment().locale('en').format('dddd').toLowerCase();
      const currentTimeString = moment().format('HH:mm');

      const tempDays = getDaysInEnglish(currentDay);
      let nearestBellsTodays: BellProps[] = [];
      tempDays.forEach((day, index) => {
        if (nearestBellsTodays.length < 10) {
          let result;
          if (index <= 0) {
            result = realm
              .objects<BellProps>('Bell')
              .filtered('day = $0 AND time > $1', day, currentTimeString)
              .sorted(['day', 'time']);
          } else {
            result = realm
              .objects<BellProps>('Bell')
              .filtered('day = $0', day)
              .sorted(['day', 'time']);
          }
          nearestBellsTodays = [...nearestBellsTodays, ...result.slice(0, 10 - nearestBellsTodays.length)];
        }
      });

      if (nearestBellsTodays.length <= 10) {
        const result = realm
          .objects<BellProps>('Bell')
          .filtered('day = $0 AND time <= $1', currentDay, currentTimeString)
          .sorted(['day', 'time']);
        nearestBellsTodays = [...nearestBellsTodays, ...result.slice(0, 10 - nearestBellsTodays.length)];
      }

      return nearestBellsTodays;

    } catch (error) {
      return [];
    }
  };

  const getDayActive = async () => {
    setIsDayActive(false);
    setDayStatus(false);
    const realm = await Realm.open({
      schema: [dayActiveSchema],
      path: 'dayActive.realm',
    });

    const day = moment().locale('en').format('dddd').toLowerCase();
    const dayActive = realm
      .objects<DayActiveProps>('Day Active')
      .find(item => item.key === KEY);

    if (dayActive && dayActive[day as keyof Omit<DayActiveProps, 'key'>]) {
      setIsDayActive(dayActive[day as keyof Omit<DayActiveProps, 'key'>]);
      setDayStatus(dayActive[day as keyof Omit<DayActiveProps, 'key'>]);
    }
  };

  const calculateTimeLeft = () => {
    const currentTime = moment();
    const duration = moment.duration(futureTime?.diff(currentTime));

    return {
      days: Math.floor(duration.asDays()),
      hours: duration.hours(),
      minutes: duration.minutes(),
      seconds: duration.seconds(),
      milliseconds: duration.milliseconds(),
    };
  };

  useEffect(() => {
    (async () => {
      if (isPlayingCard.notification && isPlayingCard.playing) {
        return setIsShowPlayingCardInComponent(true);
      }
      return setIsShowPlayingCardInComponent(false);
    })();
  }, [isPlayingCard]);

  useEffect(() => {
    if (nearestBell.length > 0) {
      const currentDay = moment().locale('en').format('dddd').toLowerCase();
      const tempDays = getDaysInEnglish(currentDay);
      const knownTime = moment().set({ hours: Number(nearestBell[0].time.split(':')[0]), minutes: Number(nearestBell[0].time.split(':')[1]), seconds: 0 });
      let tempFutureTime = knownTime.add(tempDays.indexOf(nearestBell[0].day), 'days');
      if (!tempFutureTime.isSameOrAfter(moment())) {
        tempFutureTime = knownTime.add(8, 'days');
      }
      setFutureTime(tempFutureTime);
    } else {
      setFutureTime(undefined);
    }
  }, [nearestBell]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    setLeftTime('00:00:00');
    if (futureTime) {
      interval = setInterval(() => {
        const tempLeftTime = calculateTimeLeft();
        if (tempLeftTime.milliseconds < 0) {
          setLeftTime('00:00:00');
          clearInterval(interval);
          return;
        }

        let tempCountdownViewer = '';
        if (tempLeftTime.days > 0) {
          tempCountdownViewer += `0${tempLeftTime.days}:`;
        }
        const tempHours = tempLeftTime.hours < 10 ? `0${tempLeftTime.hours}` : tempLeftTime.hours;
        const tempMinutes = tempLeftTime.minutes < 10 ? `0${tempLeftTime.minutes}` : tempLeftTime.minutes;
        const tempSeconds = tempLeftTime.seconds < 10 ? `0${tempLeftTime.seconds}` : tempLeftTime.seconds;

        tempCountdownViewer += `${tempHours}:${tempMinutes}:${tempSeconds}`;

        setLeftTime(tempCountdownViewer);
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [futureTime]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(moment().format('HH:mm:ss'));
    });
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (isFocus) {
        await getDayActive();
        const nearest = await getNearestBellsToday();
        setNearestBell([...nearest]);
      } else {
        setTimeout(() => {
          setNearestBell([]);
        }, 500);
      }
    };

    fetchData();
  }, [isFocus, isPlayingCard.notification]);

  return (
    <>
      <ScrollView
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        className="flex-1 bg-slate-50 pb-12">
        <View className="h-[18vh] bg-yellow-500 justify-center items-center relative" />
        <View className="space-y-6 -mt-[13vh] bg-transparent pb-6">
          <Card className="p-6 pb-8 mx-4">
            <View className="flex-row justify-between">
              <Text className="text-3xl font-extrabold text-yellow-500">
                Helo, apa kabar...
              </Text>
            </View>
            <View className="space-y-1 mt-6">
              <Text className="text-xl font-extrabold">
                {moment(new Date()).format('dddd, D MMMM YYYY')}
              </Text>
              <Text className="font-semibold">
                {
                  {
                    1: 'Hari aktif belajar',
                    0: 'Hari nonaktif belajar',
                  }[dayStatus ? 1 : 0]
                }
              </Text>
            </View>
          </Card>

          <Card className="mx-4 p-6 flex-row space-x-2">
            <View className="w-[40%]">
              <Text className="text-2xl font-semibold text-yellow-500">{time}</Text>
              <Text>Waktu sekarang</Text>
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-semibold">{leftTime}</Text>
              <Text>Waktu menuju bel terdekat</Text>
            </View>
          </Card>

          {isShowPlayingCardInComponent && (
            <Card className="mx-4 p-6 pb-8">
              <TouchableOpacity
                activeOpacity={0.8}
                className="absolute right-3 top-4"
                onPress={handleOnCloseCard}
              >
                <FontAwesomeIcon
                  color="#e57373"
                  icon={faTimes}
                  size={28}
                />
              </TouchableOpacity>
              <View className="gap-y-3">
                <View className="justify-center flex items-center">
                  <FontAwesomeIcon
                    color="#939393"
                    icon={faBell}
                    size={32}
                  />
                  <Text className="text-base justify-center mt-1">Bel Sedang Berdering</Text>
                </View>
                <Text numberOfLines={2} className="text-base font-semibold text-center">
                  {isPlayingCard.data?.bellName || 'Unknown Audio'}
                </Text>
                <View className="items-center mt-1">
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={handleOnStopBell}
                    className="bg-red-400 py-3 px-10 rounded-full shadow shadow-slate-100">
                    <Text className="text-white font-bold text-base text-center">
                      Hentikan Bunyi Bel
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          )}
          {
            nearestBell.length > 0 ? (
              <View className="space-y-3 mx-4">
                <Text className="text-base font-bold">
                  Bunyi bel terdekat
                </Text>
                <View>
                  {
                    nearestBell.map((item, index) => {
                      return (
                        <View key={index}>
                          <Item
                            onPress={() => handleOnItemPress(item)}
                            time={item.time}
                            title={item.name}
                            day={item.day}
                          />
                          <View className="h-4" />
                        </View>
                      );
                    })
                  }
                </View>
              </View>
            ) : (
              <Card className="mx-4 p-6 pb-8">
                <View className="gap-y-3">
                  <View className="justify-center flex items-center">
                    <FontAwesomeIcon
                      color="#939393"
                      icon={faBell}
                      size={32}
                    />
                    <Text numberOfLines={1} className="text-base font-semibold justify-center mt-1.5">Yah belum ada daftar bel nih!</Text>
                  </View>
                  <Text numberOfLines={2} className="text-base text-center">
                    Yuk tambahkan bel dulu dengan mengklik tombol dibawah
                  </Text>
                  <View className="items-center mt-1">
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={handleAddBell}
                      className="bg-yellow-500 py-3 px-10 rounded-full shadow shadow-slate-100">
                      <Text className="text-white font-bold text-base text-center">
                        Tambahkan Bel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            )
          }
        </View>
      </ScrollView>
    </>
  );
};

type ItemProps = {
  onPress: () => void;
  time: string;
  day: string;
  title: string;
};

const Item: FC<ItemProps> = memo(props => {
  const { time, title, day, onPress } = props;
  return (
    <TouchableWithoutFeedback onPress={onPress} className="w-full">
      <View className="bg-white items-center justify-center space-x-3 shadow-md shadow-slate-300 rounded-2xl py-5 px-4 flex-row border border-slate-100">
        <View className="h-12 w-12 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-300">
          <Text className="text-xl font-bold text-slate-500">
            {createInitial(title)}
          </Text>
        </View>
        <View className="flex-1 justify-center space-y-0.5">
          <View className="flex-row justify-between">
            <Text className="text-lg font-bold" numberOfLines={1}>
              {time}:00
            </Text>
            <View className="bg-gray-200 rounded-full px-4 flex items-center justify-center">
              <Text className="text-gray-500 pb-0.5">{days.find(item => item.id === day)?.label}</Text>
            </View>
          </View>
          <View className="flex-row space-x-3">
            <View className="flex-row space-x-1.5 items-center">
              <FontAwesomeIcon color="#A9A9A9" size={14} icon={faBell} />
              <Text numberOfLines={1}>{title}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
});

export default HomeScreen;
