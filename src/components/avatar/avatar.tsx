import { createInitial } from '@utils/create-initial';
import React, { FC } from 'react';
import { Image, Text, View, ViewProps } from 'react-native';

export type AvatarProps = ViewProps & {
  type?: 'default' | 'giant';
  title?: string;
  uri?: string;
};

const Avatar: FC<AvatarProps> = props => {
  const {
    className,
    uri,
    title = 'Unknown',
    type = 'default',
    ...rest
  } = props;

  const tempClassName = [
    'rounded-full bg-white shadow justify-center items-center border-[2px] border-slate-400',
  ];
  const tempInitial = ['text-3xl font-bold text-slate-400'];

  switch (type) {
    case 'giant':
      tempClassName.push('h-52 w-52');
      tempInitial.push('text-7xl font-bold');
      break;
    default:
      tempClassName.push('h-24 w-24');
      tempInitial.push('text-3xl font-bold');
      break;
  }

  if (className) {
    tempClassName.push(className);
  }

  return (
    <View className={tempClassName.join(' ')} {...rest}>
      {uri && (
        <Image
          className={`${tempClassName.join(' ')} scale-[0.98]`}
          source={{
            uri: uri,
          }}
        />
      )}
      {title && !uri && (
        <Text className={tempInitial.join(' ')}>{createInitial(title)}</Text>
      )}
    </View>
  );
};

export default Avatar;
