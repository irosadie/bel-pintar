/* eslint-disable react-hooks/exhaustive-deps */
import { Card } from '@components/card';
import { createInitial } from '@utils/create-initial';
import React, { useEffect } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { aboutUs, contributors, partners } from './../../const';
import { useNavigation } from '@react-navigation/native';

const AboutUsScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Tentang Kami',
    });
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      className="flex-1 bg-slate-50 pb-12">
      <Image
        className="w-screen h-[30vh] bg-yellow-500"
        source={require('@assets/images/about-us.png')}
      />
      <View className="-mt-16 px-5 py-4 space-y-8 mb-4">
        <Card>
          <View className="p-4 pt-8 space-y-4">
            <View className="text-base flex-row justify-start pt-4 -mt-4">
              <Text className="text-5xl font-bold -mr-6 -mt-2">
                {aboutUs[0]}
              </Text>
              <Text className="text-base mt-[9px] -ml-1">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{aboutUs[1]}
              </Text>
            </View>
            {aboutUs.map((value, index) => {
              if (index >= 2) {
                let tempValue = value;
                const textClassName = ['text-base'];
                if (value.match(/\bh1:\b/g)) {
                  tempValue = value.replace(/\bh1:/g, '');
                  textClassName.push('text-xl font-bold');
                }
                if (value.match(/\bh2:\b/g)) {
                  tempValue = value.replace(/\bh2:/g, '');
                  textClassName.push('text-lg font-semibold');
                }
                if (value.match(/\bi:\b/g)) {
                  tempValue = value.replace(/\bi:/g, '');
                  textClassName.push('italic');
                }
                return (
                  <Text key={index} className={textClassName.join(' ')}>
                    {tempValue}
                  </Text>
                );
              }
            })}
          </View>
        </Card>
        <View className="space-y-4">
          <Text className="text-lg font-semibold">Project Contributors</Text>
          {contributors.map(({ name, nim, label }, index) => {
            return (
              <View
                key={index}
                className="bg-white space-x-3 shadow-md shadow-slate-300 rounded-2xl py-5 px-4 flex-row border border-slate-100">
                <View className="h-12 w-12 mt-1 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-300">
                  <Text className="text-2xl font-bold text-slate-500">
                    {createInitial('Imron Rosadi Siregar')}
                  </Text>
                </View>
                <View className="">
                  <Text className="text-base font-semibold">{name}</Text>
                  <Text className="font-semibold">{label}</Text>
                  <Text className="mt-0.5">NIM: {nim}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View className="space-y-4">
          <Text className="text-lg font-semibold">IT Partner</Text>
          {partners.map(({ name, label }, index) => {
            return (
              <View
                key={index}
                className="bg-white space-x-3 shadow-md shadow-slate-300 rounded-2xl py-5 px-4 flex-row border border-slate-100">
                <View className="h-12 w-12 rounded-full bg-slate-200 shadow justify-center items-center border-[2px] border-slate-300">
                  <Text className="text-2xl font-bold text-slate-500">IR</Text>
                </View>
                <View className="">
                  <Text className="text-base font-semibold">{name}</Text>
                  <Text className="mt-0.5">{label}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default AboutUsScreen;
