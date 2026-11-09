import type { PlaylistConfig } from './playlistConfig';
import { ReplayMode } from './playlistConfig';

const replayModes: readonly string[] = Object.values(ReplayMode);

/**
 * Throws for the invalid playlist configs that can be detected before loading, as the load itself reports no
 * errors to the caller.
 */
export function validatePlaylistConfig({ sources, options }: PlaylistConfig) {
  if (sources.length === 0) {
    throw new Error('Playlist config has no sources');
  }
  const replayMode = options?.replayMode;
  if (replayMode !== undefined && !replayModes.includes(replayMode)) {
    throw new Error(`Unknown replay mode: ${replayMode}`);
  }
  const destroyedSource = sources.find((source) => source.isDestroyed);
  if (destroyedSource) {
    throw new Error(`Source ${destroyedSource.nativeId} was destroyed`);
  }
}
