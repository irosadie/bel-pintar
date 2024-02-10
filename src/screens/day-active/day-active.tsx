/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unstable-nested-components */
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SwitchButton } from '@components/switch-button';
import { dayActiveSchema } from './../../schemas';
import { DayActiveProps } from './../../types';
import { dayKey, days } from './../../const';
import { CardItem } from '@components/card-item';
import Toast from 'react-native-toast-message';

const INIT_DAY_ACTIVE = {
  key: dayKey,
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

const DayActiveScreen = () => {
  const initDayActive = INIT_DAY_ACTIVE;
  const navigation: any = useNavigation();
  const [dayActive, setDayActive] = useState<DayActiveProps>(initDayActive);

  const handleFetchData = async () => {
    try {
      const realm = await Realm.open({
        path: 'dayActive.realm',
        schema: [dayActiveSchema],
      });
      const storedDayActive = realm
        .objects<DayActiveProps>('Day Active')
        .find(item => {
          return item.key === dayKey;
        });
      if (storedDayActive) {
        return setDayActive(storedDayActive);
      }
      realm.write(() => {
        realm.create('Day Active', initDayActive);
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam mengambil data!',
        position: 'bottom',
      });
    }
  };

  const handleCheckboxChange = async (key: keyof typeof INIT_DAY_ACTIVE) => {
    try {
      const realm = await Realm.open({
        path: 'dayActive.realm',
        schema: [dayActiveSchema],
      });
      const result = realm.objects<DayActiveProps>('Day Active').find(item => {
        return item.key === dayKey;
      });
      if (result) {
        realm.write(() => {
          if (key !== 'key') {
            result[key] = !result[key];
          }
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam mengubah status hari aktif!',
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

  const getDayActive = (key: keyof typeof INIT_DAY_ACTIVE) => {
    if (key !== 'key') {
      return dayActive[key];
    }
    return false;
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Hari Aktif Belajar',
    });
  }, []);

  return (
    <View className="bg-slate-50 h-screen">
      <FlatList
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        ListHeaderComponent={<View className="h-5" />}
        data={days}
        renderItem={({ item }) => (
          <CardItem title={item.label}>
            <View className="flex-1 flex-row items-center">
              <Text className="text-base font-semibold flex-1">
                {item.label}
              </Text>
              <View className="w-[48px]">
                <SwitchButton
                  onToggle={() =>
                    handleCheckboxChange(
                      item.id as keyof typeof INIT_DAY_ACTIVE,
                    )
                  }
                  selected={getDayActive(
                    item.id as keyof typeof INIT_DAY_ACTIVE,
                  )}
                />
              </View>
            </View>
          </CardItem>
        )}
        keyExtractor={item => item.label}
        ItemSeparatorComponent={() => {
          return <View className="h-5" />;
        }}
        ListFooterComponent={<View className="h-5" />}
      />
    </View>
  );
};

export default DayActiveScreen;
