/**
 * Supported subtitle/caption file formats.
 * @remarks Platform: Android, iOS, tvOS
 */
export enum SubtitleFormat {
  /**
   * Closed Captioning (CEA) subtitle format.
   * @remarks Platform: Android, iOS, tvOS
   */
  CEA = 'cea',
  /**
   * Timed Text Markup Language (TTML) subtitle format.
   * @remarks Platform: Android, iOS, tvOS
   */
  TTML = 'ttml',
  /**
   * Web Video Text Tracks Format (WebVTT) subtitle format.
   * @remarks Platform: Android, iOS, tvOS
   */
  VTT = 'vtt',
  /**
   * SubRip (SRT) subtitle format.
   * @remarks Platform: Android, iOS, tvOS
   */
  SRT = 'srt',
}
