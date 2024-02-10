/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { TextInput } from '@components/text-input';
import { ScrollView } from 'react-native-gesture-handler';
import { Button } from '@components/button';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import { Avatar } from '@components/avatar';
import DocumentPicker, {
  DocumentPickerResponse,
} from 'react-native-document-picker';
import { IdentityProps } from 'src/types/identity';
import { AudioNameProps } from './../../types';
import { identitySchema } from './../../schemas';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { identityKey } from './../../const';
import RNFS from 'react-native-fs';
import Toast from 'react-native-toast-message';
import moment from 'moment';

const EditIdentityScreen = () => {
  const navigation = useNavigation();
  const [selectedFile, setSelectedFile] =
    useState<DocumentPickerResponse | null>(null);
  const [schoolName, setSchoolName] = useState<AudioNameProps>({ value: '' });
  const [uriImage, setUriImage] = useState<string>();

  const handlePickImage = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.images],
        allowMultiSelection: false,
      });
      setSelectedFile(result[0]);
      setUriImage(result[0].uri);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        setSelectedFile(null);
        return Toast.show({
          type: 'info',
          text1: 'Dibatalkan',
          text2: 'Tidak jadi memilih gambar!',
          position: 'bottom',
        });
      }
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam memilih gambar!',
        position: 'bottom',
      });
    }
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Ubah Identitas',
    });
  }, []);

  const handleSaveData = async () => {
    try {
      if (!schoolName.value) {
        return setSchoolName(prevData => ({
          ...prevData,
          error: 'This field is required',
        }));
      }
      let destinationPath = '';
      if (selectedFile) {
        const pathDir = RNFS.DocumentDirectoryPath + '/img/';

        if (!(await RNFS.exists(`${pathDir}`))) {
          await RNFS.mkdir(`${pathDir}`);
        }

        destinationPath = `${pathDir}${moment().unix()}___title_${selectedFile.name
          }`;
        await RNFS.copyFile(selectedFile.uri, destinationPath);
        setUriImage(`file://${destinationPath}`);
      }
      const realm = await Realm.open({
        schema: [identitySchema],
        path: 'identity.realm',
      });
      realm.write(() => {
        const result = realm
          .objects<IdentityProps>('Identity')
          .find(item => item.key === identityKey);

        if (result) {
          if (destinationPath) {
            result.path = destinationPath;
          }
          result.name = schoolName.value;
        } else {
          realm.create('Identity', {
            key: identityKey,
            path: destinationPath,
            name: schoolName.value,
          });
        }
      });
      realm.close();
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam menyimpan data!',
        position: 'bottom',
      });
    }
  };

  const handleFetchData = async () => {
    try {
      const realm = await Realm.open({
        schema: [identitySchema],
        path: 'identity.realm',
      });
      const result = realm
        .objects<IdentityProps>('Identity')
        .find(item => item.key === identityKey);
      if (result) {
        setSchoolName({ value: result.name });
        setUriImage(result.path ? `file://${result.path}` : undefined);
      }
      realm.close();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Kesalahan',
        text2: 'Kesalahan dalam mengambil data!',
        position: 'bottom',
      });
    }
  };

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await handleFetchData();
      })();
    }, []),
  );

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      className="flex-1 bg-white">
      <View className="justify-center pt-12 w-full space-y-10 px-4">
        <View className="items-center">
          <Avatar type="giant" uri={uriImage} title="Hello Mama Papa" />
          <TouchableOpacity
            activeOpacity={0.9}
            className="absolute top-10 right-[72px]"
            onPress={handlePickImage}>
            <View className="bg-yellow-200 rounded-full p-3 border-2 border-slate-400">
              <FontAwesomeIcon size={20} color="#9E9E9E" icon={faUpload} />
            </View>
          </TouchableOpacity>
        </View>
        <View className="space-y-6">
          <TextInput
            onChangeText={value => setSchoolName({ value })}
            placeholder="School Name"
            value={schoolName.value}
            error={schoolName.error}
          />
          <Button onPress={handleSaveData}>Simpan</Button>
        </View>
      </View>
    </ScrollView>
  );
};

export default EditIdentityScreen;
