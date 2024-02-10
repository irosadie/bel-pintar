import Sound from 'react-native-sound';

const getAudioDuration = (filePath: string) => {
  return new Promise<number>((resolve, reject) => {
    const sound = new Sound(filePath, Sound.MAIN_BUNDLE, error => {
      if (error) {
        reject(error);
      } else {
        const duration = sound.getDuration();
        resolve(Math.round(duration));
      }
    });
    sound.release();
  });
};
export default getAudioDuration;
