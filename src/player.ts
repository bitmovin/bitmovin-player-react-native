import { NativeModules, Platform } from 'react-native';
import { SourceConfig, Source } from './source';

const PlayerModule = NativeModules.PlayerModule;

export interface PlayerConfig {
  id: string;
  licenseKey: string;
}

export class Player {
  id: string;
  config: PlayerConfig;

  constructor(config: PlayerConfig) {
    PlayerModule.initWithConfig(config);
    this.id = config.id;
    this.config = config;
  }

  load = (source: SourceConfig) => {
    PlayerModule.loadSource(this.id, source);
  };

  unload = () => {
    PlayerModule.unload(this.id);
  };

  play = () => {
    PlayerModule.play(this.id);
  };

  pause = () => {
    PlayerModule.pause(this.id);
  };

  seek = (time: number) => {
    PlayerModule.seek(this.id, time);
  };

  mute = () => {
    PlayerModule.mute(this.id);
  };

  unmute = () => {
    PlayerModule.unmute(this.id);
  };

  destroy = () => {
    PlayerModule.destroy(this.id);
  };

  setVolume = (volume: number) => {
    PlayerModule.setVolume(this.id, volume);
  };

  getSource = async (): Promise<Source> => {
    return PlayerModule.source(this.id);
  };

  getVolume = async (): Promise<number> => {
    return PlayerModule.getVolume(this.id);
  };

  getCurrentTime = async (mode?: 'relative' | 'absolute'): Promise<number> => {
    return PlayerModule.currentTime(this.id, mode);
  };

  getDuration = async (): Promise<number> => {
    return PlayerModule.duration(this.id);
  };

  isMuted = async (): Promise<boolean> => {
    return PlayerModule.isMuted(this.id);
  };

  isPlaying = async (): Promise<boolean> => {
    return PlayerModule.isPlaying(this.id);
  };

  isPaused = async (): Promise<boolean> => {
    return PlayerModule.isPaused(this.id);
  };

  isLive = async (): Promise<boolean> => {
    return PlayerModule.isLive(this.id);
  };

  isAirPlayActive = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.id}] Method isAirPlayActive is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return PlayerModule.isAirPlayActive(this.id);
  };

  isAirPlayAvailable = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      console.warn(
        `[Player ${this.id}] Method isAirPlayAvailable is not available for Android. Only iOS devices.`
      );
      return false;
    }
    return PlayerModule.isAirPlayAvailable(this.id);
  };
}
