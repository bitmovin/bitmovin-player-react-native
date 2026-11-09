import BitmovinPlayer

/**
 * Representation of the React Native API `BufferLevels` object.
 * This is necessary as we need a unified representation of the different APIs from both Android and iOS.
 * - Parameter audio: `BufferLevel` for `MediaType.Audio`.
 * - Parameter video: `BufferLevel` for `MediaType.Video`.
 */
internal struct RNBufferLevels {
    let audio: BufferLevel
    let video: BufferLevel
}
