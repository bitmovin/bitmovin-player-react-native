import { NativeModules } from 'react-native';

const MediaSessionModule = NativeModules.MediaSessionModule;

export class MediaSessionApi {
  /**
   * The native player id that this buffer api is attached to.
   */
  readonly nativeId: string;

  constructor(playerId: string) {
    this.nativeId = playerId;
    // console.log(NativeModules);
  }

  setupMediaSession() {
    MediaSessionModule.setupMediaSession(this.nativeId);
  }
}
