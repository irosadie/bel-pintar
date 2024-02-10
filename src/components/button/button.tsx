import React, { FC } from 'react';
import { Text, TouchableOpacity, View, ViewProps } from 'react-native';

export type ButtonProps = ViewProps & {
  onPress: () => void;
  label?: string;
  children?: string;
};

const Button: FC<ButtonProps> = props => {
  const { label, children, onPress, ...rest } = props;
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
      <View
        className=" bg-yellow-500 p-4 rounded-full shadow shadow-slate-100"
        {...rest}>
        <Text className="text-white font-bold text-base text-center">
          {label || children}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default Button;
