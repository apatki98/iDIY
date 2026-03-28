export interface Part {
  id: string;
  name: string;
  quantity: number;
  imageUrl?: string;
}

export interface Tool {
  id: string;
  name: string;
  required: boolean;
}

export interface Step {
  index: number;
  title: string;
  description: string;
  durationMin: number;
  parts: string[];
  arLabel?: string;
}

export interface GuideJSON {
  deviceId: string;
  deviceName: string;
  totalMinutes: number;
  requiresTwoPeople: boolean;
  twoPersonSteps: number[];
  parts: Part[];
  tools: Tool[];
  steps: Step[];
}
