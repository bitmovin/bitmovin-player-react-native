import AudioSessionModule from './modules/AudioSessionModule';

/**
 * An audio session category defines a set of audio behaviors.
 * Choose a category that most accurately describes the audio behavior you require.
 *
 * Note the `playback` category is required in order to properly enable picture in picture support.
 *
 * - `ambient`: The category for an app in which sound playback is nonprimary — that is, your app also works with the sound turned off.
 * - `multiRoute`: The category for routing distinct streams of audio data to different output devices at the same time.
 * - `playAndRecord`: The category for recording (input) and playback (output) of audio, such as for a Voice over Internet Protocol (VoIP) app.
 * - `playback`: The category for playing recorded music or other sounds that are central to the successful use of your app.
 * - `record`: The category for recording audio while also silencing playback audio.
 * - `soloAmbient`: The default audio session category.
 *
 * @remarks Platform: iOS
 * @see https://developer.apple.com/documentation/avfaudio/avaudiosession/category
 */
export type AudioSessionCategory =
  | 'ambient'
  | 'multiRoute'
  | 'playAndRecord'
  | 'playback'
  | 'record'
  | 'soloAmbient';

/**
 * An object that communicates to the system how you intend to use audio in your app.
 *
 * @remarks Platform: iOS
 * @see https://developer.apple.com/documentation/avfaudio/avaudiosession
 */
export const AudioSession = {
  /**
   * Sets the audio session's category.
   *
   * @remarks Platform: iOS
   * @see https://developer.apple.com/documentation/avfaudio/avaudiosession/1616583-setcategory
   */
  setCategory: async (category: AudioSessionCategory): Promise<void> => {
    if (AudioSessionModule) {
      await AudioSessionModule.setCategory(category);
    }
  },
};
