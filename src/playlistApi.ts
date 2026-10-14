import { Source, SourceConfig } from './source';
import PlayerModule from './modules/PlayerModule';

export interface PlaylistOptions {
    /**
     * Whether to preload the next source in the playlist.
     */
    preloadNextSource?: boolean;
}

export interface PlaylistConfig {
    /**
     * The sources to be loaded.
     */
    sources: SourceConfig[];
    /**
     * The options for the playlist.
     */
    options?: PlaylistOptions;
}

/**
 * API to manage the playlist references by a player instance.
 */
export class PlaylistApi {
    private nativeId: string;

    constructor(nativeId: string) {
        this.nativeId = nativeId;
    }

    /**
     * Adds a new source to the playlist.
     * @param source - The source to be added.
     * @param index - The index at which the source should be added. If not specified, the source is added at the end.
     */
    add = (source: Source, index?: number): void => {
        source.initialize().then(() => {
            PlayerModule.playlistAdd(this.nativeId, source.nativeId, index);
        });
    };

    /**
     * Removes a source from the playlist.
     * @param source - The source to be removed.
     */
    remove = (source: Source): void => {
        PlayerModule.playlistRemove(this.nativeId, source.nativeId);
    };

    /**
     * Removes a source from the playlist at the specified index.
     * @param index - The index of the source to be removed.
     */
    removeAt = (index: number): void => {
        PlayerModule.playlistRemoveAt(this.nativeId, index);
    };

    /**
     * Seeks to the specified time in the specified source.
     * @param source - The source to seek in.
     * @param time - The time to seek to in seconds.
     */
    seek = (source: Source, time: number): void => {
        PlayerModule.playlistSeek(this.nativeId, source.nativeId, time);
    };

    /**
     * Returns the sources currently in the playlist.
     */
    get sources(): Promise<Source[]> {
        return PlayerModule.playlistSources(this.nativeId).then(
            (configs: SourceConfig[]) => {
                return configs.map((config) => new Source(config));
            }
        );
    }
}
