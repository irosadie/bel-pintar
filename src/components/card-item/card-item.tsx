import React, { FC } from 'react';
import { Card, CardProps } from '@components/card';
import { Text, View } from 'react-native';
import { createInitial } from '@utils/create-initial';

type CardItemProps = CardProps & {
  title: string;
};

const CardItem: FC<CardItemProps> = props => {
  const { title, children, ...rest } = props;
  return (
    <Card
      className="bg-white space-x-3 shadow-md shadow-slate-300 mx-4 rounded-2xl py-5 px-4 flex-row border border-slate-100"
      {...rest}>
      <View className="h-12 w-12 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-300">
        <Text className="text-xl font-bold text-slate-500">
          {createInitial(title)}
        </Text>
      </View>
      {children}
    </Card>
  );
};

export default CardItem;
