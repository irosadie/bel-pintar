import React, { FC } from 'react';
import { View, Text } from 'react-native';
import { TextInput, TextInputProps } from 'react-native-paper';

export type TextInputComponentProps = Omit<TextInputProps, 'error'> & {
  error?: string;
};

const TextInputComponent: FC<TextInputComponentProps> = props => {
  const { error, ...rest } = props;
  return (
    <View className="flex-1 min-h-[60px]">
      <TextInput
        activeUnderlineColor="transparent"
        underlineColor="transparent"
        className="bg-slate-50 rounded-xl border border-slate-300"
        placeholderTextColor="#B0B0B0"
        {...rest}
      />
      {error && <Text className="text-red-400 mt-0.5">{error}</Text>}
    </View>
  );
};

export default TextInputComponent;
