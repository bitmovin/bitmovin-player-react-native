export type BasicEvent = {
  type: string;
  target: number;
};

export type Event = BasicEvent & {
  name: string;
  timestamp: number;
};

export type PlayEvent = Event & {
  time: string;
};
