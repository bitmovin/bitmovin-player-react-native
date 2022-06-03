export type BasicEvent = {
  type: string;
  target: number;
};

export type Event = BasicEvent & {
  name: string;
  timestamp: string;
};

export type PlayEvent = Event & {
  time: string;
};
