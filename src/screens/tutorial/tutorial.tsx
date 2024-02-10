import { useCallback, useEffect, useState } from 'react';
import React, {
  AppState,
  ScrollView,
  Text,
  View,
  LayoutChangeEvent,
} from 'react-native';
import YoutubePlayer from 'react-native-youtube-iframe';
import { tutorial } from './../../const';
import { Button } from '@components/button';

const TutorialScreen = () => {
  const [playing, setPlaying] = useState(false);
  const [width, setWidth] = useState<number>(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: layoutWidth } = event.nativeEvent.layout;
    setWidth(layoutWidth);
  };

  const onStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlaying(false);
    }
  }, []);

  const togglePlaying = useCallback(() => {
    setPlaying(prev => !prev);
  }, []);

  const handleAppStateChange = (nextAppState: string) => {
    if (nextAppState === 'background') {
      setPlaying(false);
    }
  };

  useEffect(() => {
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      setPlaying(false);
      sub.remove();
    };
  }, []);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      className="flex-1 bg-slate-50 pb-12">
      <View onLayout={handleLayout} className="w-full pb-6">
        <YoutubePlayer
          webViewStyle={{ opacity: 0.99 }}
          height={(9 / 16) * width}
          play={playing}
          videoId={'SKDftvV4Tj4'}
          onChangeState={onStateChange}
          width={'100%'}
        />
        <View className="bg-white">
          <View className="p-4 -mt-4 pt-8 space-y-4">
            {tutorial.map((value, index) => {
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
            })}
          </View>
        </View>
        <View className="px-4">
          <Button onPress={togglePlaying}>
            {playing ? 'Jeda Tutorial' : 'Putar Tutorial'}
          </Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default TutorialScreen;
