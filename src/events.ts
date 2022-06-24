import { Source } from './source';

export interface Event {
  name: string;
  timestamp: number;
}

export interface ErrorEvent extends Event {
  code?: number;
  data?: Record<string, any>;
  message: string;
}

export interface TimedEvent extends Event {
  time: number;
}

export interface TimeChangedEvent extends Event {
  currentTime: number;
}

export interface SeekEvent extends Event {
  from: {
    time: number;
    source: Source;
  };
  to: {
    time: number;
    source: Source;
  };
}

export interface SourceEvent extends Event {
  source: Source;
}
