import BitmovinPlayer
import Foundation

/**
 * Global registry for the native `Source` instances created by `SourceModule`, allowing the `nativeId` of a native
 * `Source` to be resolved from anywhere in native code (e.g. when serializing events), as on Android.
 *
 * Each source is registered by an owner, e.g. a `SourceModule` instance, which can unregister all of its sources
 * without affecting the sources of another owner, e.g. of a new module instance after a reload.
 */
internal enum SourceRegistry {
    private struct Entry {
        let source: Source
        let owner: ObjectIdentifier
    }

    // Guarded by a lock, as the registry is global and can be accessed from any thread.
    private static let lock = NSLock()
    private static var sources: Registry<Entry> = [:]

    static func register(_ source: Source, nativeId: NativeId, owner: AnyObject) {
        lock.lock()
        defer { lock.unlock() }
        sources[nativeId] = Entry(source: source, owner: ObjectIdentifier(owner))
    }

    @discardableResult
    static func unregister(nativeId: NativeId) -> Source? {
        lock.lock()
        defer { lock.unlock() }
        return sources.removeValue(forKey: nativeId)?.source
    }

    static func source(nativeId: NativeId) -> Source? {
        lock.lock()
        defer { lock.unlock() }
        return sources[nativeId]?.source
    }

    /**
     * Resolves the `nativeId` of the first source matching `predicate` by iterating all sources, as an app only has
     * a few of them. `predicate` runs outside the lock, so it may use the registry itself.
     */
    static func nativeId(where predicate: (Source) -> Bool) -> NativeId? {
        lock.lock()
        let entries = sources
        lock.unlock()
        return entries.first { predicate($0.value.source) }?.key
    }

    static func nativeId(of source: Source) -> NativeId? {
        nativeId { $0 === source }
    }

    /**
     * Unregisters the sources registered by `owner`.
     */
    static func unregisterAll(owner: AnyObject) {
        lock.lock()
        defer { lock.unlock() }
        let ownerId = ObjectIdentifier(owner)
        sources = sources.filter { $0.value.owner != ownerId }
    }
}
