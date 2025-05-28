/**
 * Supported subtitle/caption file formats.
 * @platform Android, iOS, tvOS
 */
export enum SubtitleFormat {
  /**
   * Closed Captioning (CEA) subtitle format.
   * @platform Android, iOS, tvOS
   */
  CEA = 'cea',
  /**
   * Timed Text Markup Language (TTML) subtitle format.
   * @platform Android, iOS, tvOS
   */
  TTML = 'ttml',
  /**
   * Web Video Text Tracks Format (WebVTT) subtitle format.
   * @platform Android, iOS, tvOS
   */
  VTT = 'vtt',
  /**
   * SubRip (SRT) subtitle format.
   * @platform Android, iOS, tvOS
   */
  SRT = 'srt',
}
