import { FC } from 'react';
import React, { Text, View, ViewProps, Image } from 'react-native';

type NoDataProps = ViewProps & {
  title: string;
  description: string;
};

const NoData: FC<NoDataProps> = props => {
  const {
    title = 'Data Kosong!',
    description = 'Oups, belum ada data nih...',
  } = props;
  return (
    <View className="bg-transparent h-[86vh] justify-center items-center -mt-20">
      <Image
        className="w-screen h-[35vh] bg-transparent"
        source={require('@assets/images/no-data.png')}
      />
      <View className="space-y-2 px-4">
        <Text className="text-xl font-bold text-center" numberOfLines={1}>
          {title}
        </Text>
        <Text className="text-base text-center" numberOfLines={2}>
          {description}
        </Text>
      </View>
    </View>
  );
};

export default NoData;
