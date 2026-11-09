import type { NativeSourceReference } from '../modules/SourceModule';
import type { Source } from '../source';
import { FairplayDrmApi } from './fairplayDrmApi';

/** Provides DRM runtime operations for a {@link Source}, independent of its DRM configuration. */
export class SourceDrmApi {
  /**
   * FairPlay runtime operations.
   * @platform iOS/tvOS
   */
  readonly fairplay: FairplayDrmApi;

  constructor(source: Source | NativeSourceReference) {
    this.fairplay = new FairplayDrmApi(source);
  }
}
