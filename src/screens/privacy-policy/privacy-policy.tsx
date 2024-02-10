/* eslint-disable react-hooks/exhaustive-deps */
import { Card } from '@components/card';
import React, { useEffect } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import { privacyPolicy } from './../../const';
import { useNavigation } from '@react-navigation/native';

const PrivacyPolicyScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      title: 'Privasi dan Kebijakan',
    });
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      className="flex-1 bg-slate-50 pb-12">
      <Image
        className="w-screen h-[30vh] bg-yellow-500"
        source={require('@assets/images/privacy-policy.png')}
      />
      <View className="-mt-16 px-5 py-4 space-y-8 mb-4">
        <Card>
          <View className="p-4 pt-8 space-y-4">
            <View className="text-base flex-row justify-start pt-4 -mt-4">
              <Text className="text-5xl font-bold -mr-6 -mt-2">
                {privacyPolicy[0]}
              </Text>
              <Text className="text-base mt-[9px] -ml-1">
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{privacyPolicy[1]}
              </Text>
            </View>
            {privacyPolicy.map((value, index) => {
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
      </View>
    </ScrollView>
  );
};

export default PrivacyPolicyScreen;
