import { NativeSyntheticEvent } from 'react-native';
import { PropsWithRef } from 'react';
import { PureComponent } from 'react';
import * as react_native from 'react-native';
import { ViewStyle } from 'react-native';

/**
 * A basic event.
 * @public
 */
declare interface BasicEvent {
    type: string;
    target: number;
}

/**
 * Default styles for the player view.
 * @public
 */
export declare const defaultStyles: {
    baseStyle: {
        alignSelf: "stretch";
    };
};

/**
 * An event.
 * @public
 */
declare interface Event_2 extends BasicEvent {
    name: string;
    timestamp: string;
}

/**
 * A loading state.
 * @public
 */
export declare enum LoadingState {
    UNLOADED = 0,
    LOADING = 1,
    LOADED = 2
}

/**
 * The native player module.
 * @internal
 */
export declare const NativePlayerModule: any;

/**
 * The native player view.
 * @internal
 */
export declare const NativePlayerView: react_native.HostComponent<NativePlayerViewProps>;

/**
 * Props for the native player view.
 * @internal
 */
export declare interface NativePlayerViewProps {
    style?: ViewStyle;
    onPlay: (event: NativeSyntheticEvent<PlayEvent>) => void;
    onEvent: (event: NativeSyntheticEvent<Event_2>) => void;
    onReady: (event: NativeSyntheticEvent<Event_2>) => void;
}

/**
 * The player component.
 * @public
 */
export declare class Player extends PureComponent<PlayerProps> {
    private viewRef;
    constructor(props: PlayerProps);
    componentDidMount(): void;
    componentWillUnmount(): void;
    _onEvent: (event: NativeSyntheticEvent<Event_2>) => void;
    _onReady: (event: NativeSyntheticEvent<Event_2>) => void;
    _onPlay: (event: NativeSyntheticEvent<PlayEvent>) => void;
    render(): JSX.Element;
    create: (config: PlayerConfig) => void;
    loadSource: (config: SourceConfig) => void;
    unload: () => void;
    play: () => void;
    pause: () => void;
    seek: (time: number) => void;
    mute: () => void;
    unmute: () => void;
    destroy: () => void;
    setVolume: (volume: number) => void;
    getVolume: () => Promise<number>;
    getSource: () => Promise<Source | null>;
    getCurrentTime: (mode?: "absolute" | "relative" | undefined) => Promise<number>;
    getDuration: () => Promise<number>;
    isDestroyed: () => Promise<boolean>;
    isMuted: () => Promise<boolean>;
    isPaused: () => Promise<boolean>;
    isPlaying: () => Promise<boolean>;
    isLive: () => Promise<boolean>;
    isAirPlayActive: () => Promise<boolean>;
    isAirPlayAvailable: () => Promise<boolean>;
    private dispatch;
    private nodeHandle;
    private getCommandId;
}

/**
 * A player configuration
 * @public
 */
export declare interface PlayerConfig {
    licenseKey: string;
}

/**
 * Props for the player view.
 * @public
 */
export declare interface PlayerProps extends PropsWithRef<{
    config?: PlayerConfig;
    style?: ViewStyle;
    onEvent?: (event: Event_2) => void;
    onReady?: (event: Event_2) => void;
    onPlay?: (event: PlayEvent) => void;
}> {
}

/**
 * A play event.
 * @public
 */
declare interface PlayEvent extends Event_2 {
    time: string;
}

/**
 * A source.
 * @public
 */
export declare interface Source {
    duration: number;
    isActive: boolean;
    isAttachedToPlayer: boolean;
    loadingState: LoadingState;
}

/**
 * A source configuration.
 * @public
 */
export declare interface SourceConfig {
    url: string;
    type?: SourceType;
    poster?: string;
}

/**
 * A source type.
 * @public
 */
export declare enum SourceType {
    NONE = 0,
    HLS = 1,
    DASH = 2,
    PROGRESSIVE = 3,
    MOVPKG = 4
}

export { }
