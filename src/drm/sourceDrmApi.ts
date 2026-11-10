import type { NativeSource } from '../modules/sourceModule';
import { FairplayDrmApi } from './fairplayDrmApi';

/** Provides DRM runtime operations for a {@link Source}, independent of its DRM configuration. */
export class SourceDrmApi {
  /**
   * FairPlay runtime operations.
   * @platform iOS/tvOS
   */
  readonly fairplay: FairplayDrmApi;

  /** @internal */
  constructor(source: () => Promise<NativeSource>) {
    this.fairplay = new FairplayDrmApi(source);
  }
}
