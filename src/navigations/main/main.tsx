/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { TabNavigator } from '../tab';
import EditIdentityScreen from '@screens/edit-identity/edit-identity';
import { PlayerScreen } from '@screens/player';
import { DayActiveScreen } from '@screens/day-active';
import { MasterSoundScreen } from '@screens/master-sound';
import { SpecialDayScreen } from '@screens/special-day';
import { PrivacyPolicyScreen } from '@screens/privacy-policy';
import { AboutUsScreen } from '@screens/about-us';
import { TutorialScreen } from '@screens/tutorial';
import { BellFormScreen } from '@screens/bell-form';
import { BellDetailScreen } from '@screens/bell-detail';
import { BellEditScreen } from '@screens/bell-edit';

const MainNavigator = () => {
  const Stack = createStackNavigator();

  return (
    <Stack.Navigator>
      {/* tab navigation end */}
      <Stack.Screen
        name="TabScreen"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      {/* tab navigation end */}

      {/* edit identity start */}
      <Stack.Screen name="Edit Identity" component={EditIdentityScreen} />
      {/* edit identity end */}

      {/* player start */}
      <Stack.Screen
        options={{ headerShown: false }}
        name="Player"
        component={PlayerScreen}
      />
      {/* player end */}

      {/* navigation for configs 1 start */}
      <Stack.Screen name="Day Active" component={DayActiveScreen} />
      <Stack.Screen name="Master Sound" component={MasterSoundScreen} />
      <Stack.Screen name="Special Day" component={SpecialDayScreen} />
      {/* navigation for configs 1 end */}

      {/* navigation for configs 2 start */}
      <Stack.Screen name="Privacy Policy" component={PrivacyPolicyScreen} />
      <Stack.Screen name="About Us" component={AboutUsScreen} />
      <Stack.Screen name="Tutorial" component={TutorialScreen} />
      {/* navigation for configs 2 end */}

      <Stack.Screen name="Bell Form" component={BellFormScreen} />
      <Stack.Screen
        options={{ headerShown: false }}
        name="Bell Detail"
        component={BellDetailScreen}
      />
      <Stack.Screen name="Bell Edit" component={BellEditScreen} />
    </Stack.Navigator>
  );
};

export default MainNavigator;
