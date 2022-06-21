import { Source } from './components/Player';

export interface PlayerEvent {
  name: string;
  timestamp: number;
}

export interface PlayerErrorEvent extends PlayerEvent {
  message: string;
  code?: number;
  data?: Record<string, any>;
}

export interface TimedEvent extends PlayerEvent {
  time: number;
}

export interface TimeChangedEvent extends PlayerEvent {
  currentTime: number;
}

export interface SeekEvent extends PlayerEvent {
  from: {
    time: number;
    source: Source;
  };
  to: {
    time: number;
    source: Source;
  };
}

export interface SourceEvent extends PlayerEvent {
  source: Source;
}
