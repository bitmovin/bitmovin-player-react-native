import { Source } from './components/Player';

export interface ReactEvent {
  target: number;
}

export interface PlayerEvent extends ReactEvent {
  name: string;
  timestamp: number;
}

export interface PlayerErrorEvent extends PlayerEvent {
  code?: number;
  message: string;
  data?: {
    code: number;
    message: string;
    underlyingError?: {
      code: number;
      domain: string;
      description: string;
      localizedDescription: string;
    };
  };
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
