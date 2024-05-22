import { NativeInstanceConfig } from '../nativeInstance';

/**
 * Available HTTP request types.
 */
export enum HttpRequestType {
  ManifestDash = 'manifest/dash',
  ManifestHlsMaster = 'manifest/hls/master',
  ManifestHlsVariant = 'manifest/hls/variant',
  ManifestSmooth = 'manifest/smooth',
  MediaProgressive = 'media/progressive',
  MediaAudio = 'media/audio',
  MediaVideo = 'media/video',
  MediaSubtitles = 'media/subtitles',
  MediaThumbnails = 'media/thumbnails',
  DrmLicenseFairplay = 'drm/license/fairplay',
  DrmCertificateFairplay = 'drm/certificate/fairplay',
  DrmLicenseWidevine = 'drm/license/widevine',
  KeyHlsAes = 'key/hls/aes',
  Unknown = 'unknown',
}

/**
 * Base64-encoded string representing the HTTP request body.
 */
export type HttpRequestBody = string;

/** Represents an HTTP request. */
export interface HttpRequest {
  /** The request body to send to the server. */
  body?: HttpRequestBody;
  /**
   * The HTTP Headers of the request.
   * Entries are expected to have the HTTP header as the key and its string content as the value.
   */
  headers: Record<string, string>;
  /** The HTTP method of the request. */
  method: string;
  /** The URL of the request. */
  url: string;
}

/**
 * Base64-encoded string representing the HTTP response body.
 */
export type HttpResponseBody = string;

/** Represents an HTTP response. */
export interface HttpResponse {
  /** The body of the response. */
  body?: HttpResponseBody;
  /**
   * The HTTP Headers of the response.
   * Entries are expected to have the HTTP header as the key and its string content as the value.
   */
  headers: Record<string, string>;
  /** The corresponding request object of the response. */
  request: HttpRequest;
  /** The HTTP status code of the response. */
  status: number;
  /** The URL of the response. May differ from {@link HttpRequest.url} when redirects have happened. */
  url: string;
}

/**
 * The network API gives the ability to influence network requests.
 * It enables preprocessing requests and processing responses.
 */
export interface NetworkConfig extends NativeInstanceConfig {
  /**
   * Called before a HTTP request is made.
   * Can be used to change request parameters.
   * TODO: add code sample (see web API reference)
   */
  preprocessHttpRequest?: (
    type: HttpRequestType,
    request: HttpRequest
  ) => Promise<HttpRequest>;
  /**
   * Can be used to the access or change properties of the response before it gets into the player.
   * TODO: add code sample (see web API reference)
   */
  preprocessHttpResponse?: (
    type: HttpRequestType,
    response: HttpResponse
  ) => Promise<HttpResponse>;
}
