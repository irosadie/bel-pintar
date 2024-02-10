/* eslint-disable react-native/no-inline-styles */
/* eslint-disable react/no-unstable-nested-components */
import React from 'react-native';
import { BellScreen } from '@screens/bell';
import { HomeScreen } from '@screens/home';
import { SettingScreen } from '@screens/setting';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faBell, faCog, faHomeAlt } from '@fortawesome/free-solid-svg-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const TabNavigator = () => {
  const Tab = createBottomTabNavigator();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => false,
        tabBarActiveTintColor: '#FFF',
        tabBarInactiveTintColor: '#3e2465',
        tabBarStyle: { backgroundColor: '#efbf00', height: 60, paddingTop: 6 },
        tabBarLabelStyle: { marginBottom: 6, fontSize: 12 },
        tabBarIcon: ({ focused }) => {
          switch (route.name) {
            case 'Home':
              return (
                <FontAwesomeIcon
                  icon={faHomeAlt}
                  color={focused ? '#F3f3f3' : '#FFF'}
                  size={24}
                />
              );
            case 'Bell':
              return (
                <FontAwesomeIcon
                  icon={faBell}
                  color={focused ? '#F3f3f3' : '#FFF'}
                  size={24}
                />
              );
            default:
              return (
                <FontAwesomeIcon
                  icon={faCog}
                  color={focused ? '#F3f3f3' : '#FFF'}
                  size={24}
                />
              );
          }
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Bell"
        options={{ title: 'Bel' }}
        component={BellScreen}
      />
      <Tab.Screen name="Setting" component={SettingScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
