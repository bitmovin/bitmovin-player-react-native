import { NativeModules } from 'react-native';
import { SourceConfig, Source } from './source';

const PlayerModule = NativeModules.PlayerModule;

export interface PlayerConfig {
  id: string;
  licenseKey: string;
}

export class Player {
  id: string;
  config: PlayerConfig;
  isInitialized = false;

  constructor(config: PlayerConfig) {
    this.id = config.id;
    this.config = config;
  }

  load = (source: SourceConfig) => {
    if (!this.isInitialized) {
      PlayerModule.initWithConfig(this.config);
      this.isInitialized = true;
    }
    PlayerModule.load(this.id, source);
  };

  destroy = () => {
    PlayerModule.destroy(this.id);
  };

  play = () => {
    PlayerModule.play(this.id);
  };

  getSource = async (): Promise<Source> => {
    return PlayerModule.getSource(this.id);
  };
}
