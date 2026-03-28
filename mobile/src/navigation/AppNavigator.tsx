import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '../theme';
import { GuideJSON } from '../types/guide';
import { MOCK_GUIDE } from '../types/guide.mock';
import {
  HomeScreen,
  PreAssemblyChecklistScreen,
  ARAssemblyScreen,
  ErrorDetectionScreen,
  PostAssemblyScreen,
} from '../screens';

export type RootStackParamList = {
  Home: undefined;
  Checklist: { guide: GuideJSON };
  Assembly: { guide: GuideJSON };
  ErrorDetection: { type: 'correction' | 'safety'; message: string };
  PostAssembly: { guide: GuideJSON };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.cream },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Home">
          {({ navigation }) => (
            <HomeScreen
              onStartAssembly={() => {
                navigation.navigate('Checklist', { guide: MOCK_GUIDE });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Checklist">
          {({ route, navigation }) => (
            <PreAssemblyChecklistScreen
              guide={route.params.guide}
              onReady={() => {
                navigation.navigate('Assembly', { guide: route.params.guide });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="Assembly">
          {({ route, navigation }) => (
            <ARAssemblyScreen
              guide={route.params.guide}
              onFinish={() => {
                navigation.navigate('PostAssembly', { guide: route.params.guide });
              }}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="ErrorDetection">
          {({ route, navigation }) => (
            <ErrorDetectionScreen
              type={route.params.type}
              message={route.params.message}
              onAcknowledge={() => navigation.goBack()}
              onDismiss={() => navigation.goBack()}
            />
          )}
        </Stack.Screen>

        <Stack.Screen name="PostAssembly">
          {({ route, navigation }) => (
            <PostAssemblyScreen
              guide={route.params.guide}
              onSaveToInventory={() => {
                navigation.popToTop();
              }}
            />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
