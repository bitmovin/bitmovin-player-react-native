import { NativeModules } from 'react-native';

const AudioSessionModule = NativeModules.AudioSessionModule;

export type AudioSessionCategory =
  | 'ambient'
  | 'multiRoute'
  | 'playAndRecord'
  | 'playback'
  | 'soloAmbient';

export interface AudioSessionType {
  setCategory: (category: AudioSessionCategory) => Promise<void>;
}

export const AudioSession: AudioSessionType = {
  setCategory: async (category) => {
    if (AudioSessionModule) {
      await AudioSessionModule.setCategory(category);
    }
  },
};
