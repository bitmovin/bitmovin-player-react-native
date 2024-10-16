import { NativeModules } from 'react-native';

const MediaSessionModule = NativeModules.MediaSessionModule;

export class MediaSessionApi {
  /**
   * The native player id that this buffer api is attached to.
   */
  readonly nativeId: string;

  constructor(playerId: string) {
    // if service exists, take native id from it, and dont use playerId at all

    this.nativeId = playerId;
    // FINAL:
    // when player is created on RN, it always creates a player on native side
    // and sets itself in-charge of the service. So the last player will be the
    // one in charge.
    // So I'll never go and retrieve the instance from the service, but just put it.
  }

  /**
   * Sets up the Media Session for the Player.
   * In case there is already an existing Media Session, the player will be put
   * in charge of it.
   */
  // setupMediaSession = async (): Promise<void> => {
  //   return MediaSessionModule.setupMediaSession(this.nativeId);
  // };
}
