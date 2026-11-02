import BitmovinPlayer
import Foundation

/**
 * Global lookup of the `nativeId`s of the native `Source` instances created by `SourceModule`, so that sources in
 * event payloads can be mapped back to their JS `Source` instances.
 */
internal enum SourceNativeIdRegistry {
    private static let lock = NSLock()
    private static var nativeIds: [ObjectIdentifier: NativeId] = [:]

    static func register(_ source: Source, nativeId: NativeId) {
        lock.lock()
        defer { lock.unlock() }
        nativeIds[ObjectIdentifier(source as AnyObject)] = nativeId
    }

    static func unregister(_ source: Source) {
        lock.lock()
        defer { lock.unlock() }
        nativeIds.removeValue(forKey: ObjectIdentifier(source as AnyObject))
    }

    static func nativeId(of source: Source) -> NativeId? {
        lock.lock()
        defer { lock.unlock() }
        return nativeIds[ObjectIdentifier(source as AnyObject)]
    }

    static func clear() {
        lock.lock()
        defer { lock.unlock() }
        nativeIds.removeAll()
    }
}
