import type { Source } from '../source';
import { FairplayDrmApi } from './fairplayDrmApi';

/** Provides DRM runtime operations for a {@link Source}, independent of its DRM configuration. */
export class SourceDrmApi {
  /**
   * FairPlay runtime operations.
   * @platform iOS/tvOS
   */
  readonly fairplay: FairplayDrmApi;

  /** @internal */
  constructor(source: Source) {
    this.fairplay = new FairplayDrmApi(source);
  }
}
