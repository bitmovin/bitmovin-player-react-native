declare module 'bitmovin-player-react-native' {
  export class Player {
    readonly nativeId: string;
    isInitialized: boolean;
    isDestroyed: boolean;
    initialize(): Promise<void>;
    registerDestroyResource(resource: {
      destroy(): void | Promise<void>;
    }): () => void;
    destroy(): void;
  }
}
