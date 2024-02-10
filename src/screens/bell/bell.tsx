/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import { FC, useCallback, useEffect, useState } from 'react';
import React, {
  FlatList,
  Text,
  View,
  Modal,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import {
  faAdd,
  faBell,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { bellSchema, dayActiveSchema } from './../../schemas';
import { BellProps } from 'src/types';
import { createInitial } from '@utils/create-initial';
import { NoData } from '@components/no-data';
import { DayActiveProps } from 'src/types/day-active';
import { dayKey, days as dayList } from './../../const';
import { convertDay } from '@utils/convert-day';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import Toast from 'react-native-toast-message';
import Realm from 'realm';
import moment from 'moment';

const KEY = dayKey;

const BellScreen = () => {
  const [bells, setBells] = useState<(BellProps & { path?: string })[]>([]);
  const [days] = useState(dayList.map(day => day.label));
  const [day, setDay] = useState(days[0]);
  const [isShowDay, setIsShowDay] = useState(false);
  const [isDayActive, setIsDayActive] = useState(false);

  const navigation: any = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Bel',
    });
  }, []);

  const handleFetchData = async () => {
    const realmBell = await Realm.open({
      schema: [bellSchema],
      path: 'bell.realm',
    });
    const realm2 = await Realm.open({
      schema: [dayActiveSchema],
      path: 'dayActive.realm',
    });
    try {
      const storedBell = realmBell
        .objects<BellProps>('Bell')
        .filtered('day == $0', convertDay(day))
        .sorted('time', false);

      if (storedBell.length > 0) {
        setBells([...storedBell]);
      } else {
        setBells([]);
      }
      setIsDayActive(false);
      const tempDay = convertDay(day);
      const dayActive = realm2
        .objects<DayActiveProps>('Day Active')
        .find(item => item.key === KEY);

      if (
        dayActive &&
        dayActive[tempDay as keyof Omit<DayActiveProps, 'key'>]
      ) {
        setIsDayActive(dayActive[tempDay as keyof Omit<DayActiveProps, 'key'>]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam bell.realm!',
        position: 'bottom',
        bottomOffset: 68,
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await handleFetchData();
      })();
    }, [day]),
  );

  const handleOnPrev = () => {
    setDay(prevData => {
      const index = days.findIndex(d => prevData === d);
      if (index !== -1 && index > 0) {
        return days[index - 1];
      }
      return dayList[dayList.length - 1].label;
    });
  };

  const handleOnNext = () => {
    setDay(prevData => {
      const index = days.findIndex(d => prevData === d);
      if (index !== -1 && index < days.length - 1) {
        return days[index + 1];
      }
      return dayList[0].label;
    });
  };

  return (
    <View className="bg-slate-50 h-[100%]">
      <FlatList
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={
          <View className="py-4 bg-yellow-400 mb-4 flex-row items-center justify-center space-x-10">
            <View>
              <TouchableOpacity activeOpacity={0.8} onPress={handleOnPrev}>
                <FontAwesomeIcon size={24} color="#fff" icon={faChevronLeft} />
              </TouchableOpacity>
            </View>
            <View className="items-center mt-2">
              <TouchableWithoutFeedback onPress={() => setIsShowDay(v => !v)}>
                <Text className="text-xl font-bold text-white">{day}</Text>
              </TouchableWithoutFeedback>
              <Text className="mt-1 text-yellow-700 min-w-[20]">
                {
                  {
                    1: 'hari aktif belajar',
                    0: 'bukan hari aktif belajar',
                  }[isDayActive ? 1 : 0]
                }
              </Text>
            </View>
            <View>
              <TouchableOpacity activeOpacity={0.8} onPress={handleOnNext}>
                <FontAwesomeIcon size={24} color="#fff" icon={faChevronRight} />
              </TouchableOpacity>
            </View>
          </View>
        }
        stickyHeaderIndices={[0]}
        ListEmptyComponent={
          <NoData
            title="Tidak ada bunyi bell"
            description={`Tidak ada bunyi bell dihari ${day}`}
          />
        }
        data={bells}
        renderItem={({ item }) => (
          <Item
            onPress={() => {
              navigation.navigate('Bell Detail', { bellKey: item.key });
            }}
            time={item.time}
            title={item.name}
            createdAt={item.createdAt}
          />
        )}
        keyExtractor={item => item.key}
        ItemSeparatorComponent={() => {
          return <View className="h-4" />;
        }}
        ListFooterComponent={<View className="h-5" />}
      />
      {isShowDay && (
        <>
          <Modal animationType="fade" transparent={true} visible={isShowDay}>
            <View
              onTouchEnd={() => setIsShowDay(false)}
              className="bg-[#00000050] w-full h-[110vh] absolute"
            />
            <View className="w-full h-[110vh] absolute justify-center items-center -mt-10">
              <View className="w-[90%] bg-white h-[60vh] rounded-xl px-1 shadow border border-slate-100 shadow-slate-200 py-2">
                <FlatList
                  showsVerticalScrollIndicator={false}
                  showsHorizontalScrollIndicator={false}
                  ListHeaderComponent={<View className="h-5" />}
                  data={dayList.map(v => v.label)}
                  renderItem={({ item }) => (
                    <TouchableWithoutFeedback
                      key={item}
                      onPress={() => {
                        setDay(item);
                        setIsShowDay(false);
                      }}>
                      <View className="bg-white space-x-3 shadow-md shadow-slate-300 rounded-2xl mx-3 py-4 px-4 flex-row border border-slate-100">
                        <View className="h-12 w-12 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-300">
                          <Text className="text-2xl font-bold text-slate-500">
                            S
                          </Text>
                        </View>
                        <View className="flex-1 flex-row items-center">
                          <Text className="text-base font-semibold flex-1">
                            {item}
                          </Text>
                        </View>
                      </View>
                    </TouchableWithoutFeedback>
                  )}
                  keyExtractor={item => item}
                  ItemSeparatorComponent={() => {
                    return <View className="h-4" />;
                  }}
                />
              </View>
            </View>
          </Modal>
        </>
      )}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          navigation.navigate('Bell Form');
        }}>
        <View className="absolute p-4 text-white bottom-6 rounded-full right-6 bg-yellow-500 shadow shadow-gray-400">
          <FontAwesomeIcon color="#fff" icon={faAdd} size={24} />
        </View>
      </TouchableOpacity>
    </View>
  );
};

type ItemProps = {
  onPress: () => void;
  time: string;
  createdAt: Date;
  title: string;
};

const Item: FC<ItemProps> = props => {
  const { time, title, createdAt, onPress } = props;

  return (
    <TouchableWithoutFeedback onPress={onPress} className="w-full">
      <View className="bg-white items-center justify-center space-x-3 shadow-md shadow-slate-300 mx-4 rounded-2xl py-5 px-4 flex-row border border-slate-100">
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
            {moment(createdAt).isAfter(moment().subtract(1, 'hour')) && (
              <View className="bg-yellow-300 rounded-full px-4 flex items-center justify-center">
                <Text className="text-yellow-600 pb-0.5">new</Text>
              </View>
            )}
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
};

export default BellScreen;
