import BitmovinPlayer
import Foundation

/**
 * Global registry for the native `Source` instances created by `SourceModule`, allowing the `nativeId` of a native
 * `Source` to be resolved from anywhere in native code (e.g. when serializing events), as on Android.
 */
internal enum SourceRegistry {
    // Guarded by a lock, as the registry is global and can be accessed from any thread.
    private static let lock = NSLock()
    private static var sources: Registry<Source> = [:]

    static func register(_ source: Source, nativeId: NativeId) {
        lock.lock()
        defer { lock.unlock() }
        sources[nativeId] = source
    }

    @discardableResult
    static func unregister(nativeId: NativeId) -> Source? {
        lock.lock()
        defer { lock.unlock() }
        return sources.removeValue(forKey: nativeId)
    }

    static func source(nativeId: NativeId) -> Source? {
        lock.lock()
        defer { lock.unlock() }
        return sources[nativeId]
    }

    /**
     * Resolves the `nativeId` of the first source matching `predicate` by iterating all sources, as an app only has
     * a few of them.
     */
    static func nativeId(where predicate: (Source) -> Bool) -> NativeId? {
        lock.lock()
        defer { lock.unlock() }
        return sources.first { predicate($0.value) }?.key
    }

    static func nativeId(of source: Source) -> NativeId? {
        nativeId { $0 === source }
    }

    static func clear() {
        lock.lock()
        defer { lock.unlock() }
        sources.removeAll()
    }
}
