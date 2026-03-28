import React from 'react';

// TODO: install ViroReact — `npm install @reactvision/react-viro@2.53.1`
// import { ViroBox, ViroMaterials, ViroText, ViroNode } from '@reactvision/react-viro';

type BoundingBoxProps = {
  label: string;
  position?: [number, number, number]; // AR world coordinates [x, y, z]
};

export function BoundingBox({ label, position = [0, 0, -1] }: BoundingBoxProps) {
  // TODO: replace with ViroReact components once installed
  // ViroMaterials.createMaterials({
  //   boundingBox: {
  //     diffuseColor: '#00FF88',
  //     transparency: 0.3,
  //   },
  // });

  // return (
  //   <ViroNode position={position}>
  //     <ViroBox
  //       scale={[0.3, 0.3, 0.3]}
  //       materials={['boundingBox']}
  //     />
  //     <ViroText
  //       text={label}
  //       scale={[0.5, 0.5, 0.5]}
  //       position={[0, 0.25, 0]}
  //       style={{ color: '#FFFFFF', fontSize: 14 }}
  //     />
  //   </ViroNode>
  // );

  console.log(`[BoundingBox] label="${label}" position=${JSON.stringify(position)}`);
  return null; // placeholder until ViroReact is wired up
}
