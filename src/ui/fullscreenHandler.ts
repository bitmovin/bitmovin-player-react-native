/**
 * Handles the UI state change when fullscreen should be entered or exited.
 */
export interface FullscreenHandler {
  /**
   * Indicates if the UI is currently in fullscreen mode
   */
  isFullscreenActive: boolean;

  /**
   * Is called by the `PlayerView` when the UI should enter fullscreen mode.
   */
  enterFullscreen(): void;

  /**
   * Is called by the `PlayerView` when the UI should exit fullscreen mode.
   */
  exitFullscreen(): void;
}
