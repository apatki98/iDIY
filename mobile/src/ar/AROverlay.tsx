import React from 'react';
import { View, StyleSheet } from 'react-native';

// TODO: install ViroReact — `npm install @reactvision/react-viro@2.53.1`
// import { ViroARScene, ViroARSceneNavigator } from '@reactvision/react-viro';

import { BoundingBox } from './BoundingBox';
import { Step } from '../types/guide';

type AROverlayProps = {
  currentStep: Step | null;
};

export function AROverlay({ currentStep }: AROverlayProps) {
  // Only render a bounding box if the current step has an AR label
  const arLabel = currentStep?.arLabel ?? null;

  // TODO: wrap in ViroARSceneNavigator once ViroReact is installed
  // return (
  //   <ViroARSceneNavigator
  //     autofocus
  //     initialScene={{ scene: ARScene }}
  //     style={StyleSheet.absoluteFill}
  //   />
  // );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {arLabel && (
        <BoundingBox
          label={arLabel}
          position={[0, 0, -1]} // default: 1m in front of camera
        />
      )}
    </View>
  );
}

// TODO: inner AR scene — move into its own file once ViroReact is wired up
// function ARScene() {
//   return (
//     <ViroARScene>
//       {arLabel && <BoundingBox label={arLabel} position={[0, 0, -1]} />}
//     </ViroARScene>
//   );
// }
