import { GuideJSON } from './guide';

export const MOCK_GUIDE: GuideJSON = {
  deviceId: 'IKEA-MALM-AA2301456',
  deviceName: 'IKEA MALM 6-drawer dresser',
  totalMinutes: 90,
  requiresTwoPeople: true,
  twoPersonSteps: [3, 6],
  parts: [
    { id: 'side-panel', name: 'Side panel A', quantity: 2 },
    { id: 'drawer-front', name: 'Drawer front', quantity: 6 },
    { id: 'cam-lock', name: 'Cam lock nut', quantity: 24 },
  ],
  tools: [
    { id: 'screwdriver', name: 'Phillips screwdriver #2', required: true },
    { id: 'mallet', name: 'Rubber mallet', required: true },
    { id: 'level', name: 'Level', required: false },
  ],
  steps: [
    {
      index: 0,
      title: 'Unbox and sort parts',
      description: 'Lay all parts on the floor and match them to the parts list.',
      durationMin: 15,
      parts: ['side-panel', 'drawer-front', 'cam-lock'],
    },
    {
      index: 1,
      title: 'Assemble the frame',
      description: 'Connect the side panels using cam lock nuts.',
      durationMin: 25,
      parts: ['side-panel', 'cam-lock'],
      arLabel: 'Side panel A',
    },
    {
      index: 2,
      title: 'Attach drawer fronts',
      description: 'Slide each drawer into its rail and click the front into place.',
      durationMin: 20,
      parts: ['drawer-front'],
      arLabel: 'Drawer front',
    },
  ],
};
