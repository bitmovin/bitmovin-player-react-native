import { Platform } from 'react-native';
import type { SourceType } from '../source';
import type { PlaylistConfig } from './playlistConfig';
import { ReplayMode } from './playlistConfig';

const replayModes: readonly string[] = Object.values(ReplayMode);

/**
 * The source types the iOS SDK can play as part of a playlist.
 */
const iosPlaylistSourceTypes: readonly (`${SourceType}` | undefined)[] = [
  'hls',
  'progressive',
];

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
  // A source can only be attached to a player once: Android throws natively after unloading the current
  // session, and iOS ignores the duplicate.
  const duplicateSource = sources.find(
    (source, index) => sources.indexOf(source) !== index
  );
  if (duplicateSource) {
    throw new Error(`Source object is part of the playlist more than once`);
  }
  if (Platform.OS === 'ios') {
    const unsupportedSource = sources.find(
      (source) => !iosPlaylistSourceTypes.includes(source.config?.type)
    );
    if (unsupportedSource) {
      throw new Error(
        `Source object cannot be part of a playlist on iOS: only HLS and progressive sources are supported`
      );
    }
  }
}
