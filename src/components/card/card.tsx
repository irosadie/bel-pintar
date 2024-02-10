import React, { FC } from 'react';
import { View, ViewProps } from 'react-native';

export type CardProps = ViewProps & {};

const Card: FC<CardProps> = props => {
  const { children, ...rest } = props;
  return (
    <View
      className="rounded-2xl shadow-md shadow-slate-300 bg-white h-auto"
      {...rest}>
      {children}
    </View>
  );
};

export default Card;
