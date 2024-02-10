/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-shadow */
import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faCalendarDays, faEdit } from '@fortawesome/free-regular-svg-icons';
import { ScrollView } from 'react-native-gesture-handler';
import {
  faChevronRight,
  faCircleInfo,
  faFileShield,
  faVolumeLow,
} from '@fortawesome/free-solid-svg-icons';
import { faYoutube } from '@fortawesome/free-brands-svg-icons';
import { Avatar } from '@components/avatar';
import { IdentityProps } from 'src/types';
import { identitySchema } from './../../schemas';
import { Card, CardProps } from '@components/card';
import moment from 'moment';

const MENU_1 = [
  {
    title: 'Hari Aktif Belajar',
    description: 'Pengaturan untuk hari aktif belajar',
    icon: <FontAwesomeIcon icon={faCalendarDays} size={18} color="#9E9E9E" />,
    navigate: 'Day Active',
  },
  {
    title: 'Bank Suara',
    description: 'Atur bunyi bel sesuai kebutuhan',
    icon: <FontAwesomeIcon icon={faVolumeLow} size={18} color="#9E9E9E" />,
    navigate: 'Master Sound',
  },
];

const MENU_2 = [
  {
    title: 'Privasi dan Kebijakan',
    description: '',
    icon: <FontAwesomeIcon icon={faFileShield} size={18} color="#9E9E9E" />,
    navigate: 'Privacy Policy',
  },
  {
    title: 'Tentang Kami',
    description: '',
    icon: <FontAwesomeIcon icon={faCircleInfo} size={18} color="#9E9E9E" />,
    navigate: 'About Us',
  },
  {
    title: 'Tutorial',
    description: '',
    icon: <FontAwesomeIcon icon={faYoutube} size={18} color="#9E9E9E" />,
    navigate: 'Tutorial',
  },
];

const KEY = 'identityKey';

const SettingScreen = () => {
  const navigation: any = useNavigation();

  const [schoolName, setSchoolName] = useState('Nama Sekolah Mu');
  const [uriImage, setUriImage] = useState<string>();

  const handleOnEdit = () => {
    navigation.navigate('Edit Identity');
  };

  const handleFetchData = async () => {
    const realm = await Realm.open({
      schema: [identitySchema],
      path: 'identity.realm',
    });

    const result = realm
      .objects<IdentityProps>('Identity')
      .find(item => item.key === KEY);

    if (result) {
      setSchoolName(result.name);
      setUriImage(result.path ? `file://${result.path}` : undefined);
    }

    realm.close();
  };

  useFocusEffect(
    useCallback(() => {
      handleFetchData();
    }, []),
  );

  useEffect(() => {
    navigation.setOptions({
      title: 'Pengaturan',
    });
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      className="flex-1 bg-slate-50 pb-12">
      <View className="h-[30vh] bg-yellow-500 justify-center items-center relative">
        <View className="absolute top-5 right-5">
          <TouchableOpacity activeOpacity={0.8} onPress={handleOnEdit}>
            <FontAwesomeIcon icon={faEdit} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        <Avatar title={schoolName} uri={uriImage} />
        <View className="px-5 py-4">
          <Text className="text-center font-bold text-xl text-white">
            {schoolName}
          </Text>
        </View>
      </View>
      <View className="-mt-16 px-5 py-4 space-y-8">
        <CardList data={MENU_1} />
        <View className="space-y-4">
          <Text className="text-lg font-semibold">Lainnya</Text>
          <CardList verticalSpace="2" data={MENU_2} />
        </View>
        <View>
          <View>
            <Text className="text-center">Versi Aplikasi: 1.0.1</Text>
          </View>
          <View>
            <Text className="text-center">
              &copy; {moment().format('yyyy')} Oleh{' '}
              <Text className="font-semibold">
                Mahasiswa, S2 Pendas FKIP UNRI23
              </Text>{' '}
              | Hak cipta dilindungi
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default SettingScreen;

// touchable list
type DataProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  navigate: string;
};

type TouchableListProps = DataProps;

const TouchableList: FC<TouchableListProps> = props => {
  const navigation: any = useNavigation();

  const { title, description, icon, navigate, ...rest } = props;

  const handleOnPress = (navigate: string) => {
    navigation.navigate(navigate);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      className="flex-row justify-between px-5 gap-2.5"
      onPress={() => handleOnPress(navigate)}
      {...rest}>
      <View>
        <View className="h-12 w-12 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-200">
          {icon}
        </View>
      </View>
      <View className="bg-white flex-1 justify-center">
        <Text className="text-base font-semibold">{title}</Text>
        {description && <Text>{description}</Text>}
      </View>
      <View className="justify-center">
        <FontAwesomeIcon icon={faChevronRight} size={16} />
      </View>
    </TouchableOpacity>
  );
};

type CardListProps = CardProps & {
  data: DataProps[];
  verticalSpace?: '2' | '3';
};

const CardList: FC<CardListProps> = props => {
  const { data, verticalSpace = 3, ...rest } = props;

  const listClassName = ['py-5'];

  if (verticalSpace === '2') {
    listClassName.push('space-y-1.5');
  } else {
    listClassName.push('space-y-3.5');
  }

  return (
    <Card {...rest}>
      <View className={listClassName.join(' ')}>
        {data.map((value, index) => {
          return (
            <TouchableList
              key={index}
              title={value.title}
              description={value.description}
              icon={value.icon}
              navigate={value.navigate}
            />
          );
        })}
      </View>
    </Card>
  );
};
