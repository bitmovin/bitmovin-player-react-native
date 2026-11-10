import BitmovinPlayer
import Foundation

/**
 * Global registry for the native `Source` instances created by `SourceModule`, allowing the `nativeId` of a native
 * `Source` to be resolved from anywhere in native code (e.g. when serializing events), as on Android.
 *
 * Each source is registered by an owner, e.g. a `SourceModule` instance, which can unregister all of its sources
 * without affecting the sources of another owner, e.g. of a new module instance after a reload.
 *
 * Each registration gets a new instance id, which tells a source created again for the same `nativeId` apart from
 * the released one.
 */
internal enum SourceRegistry {
    private struct Entry {
        let sharedSource: SharedSource
        var source: Source { sharedSource.source }
        let owner: ObjectIdentifier
        let instanceId: Int
    }

    // Guarded by a lock, as the registry is global and can be accessed from any thread.
    private static let lock = NSLock()
    private static var sources: Registry<Entry> = [:]
    private static var nextInstanceId = 0

    /**
     - Returns: The instance id of this registration.
     */
    @discardableResult
    static func register(
        _ source: Source,
        nativeId: NativeId,
        owner: AnyObject,
        callback: CallbackScope?
    ) -> Int {
        lock.lock()
        defer { lock.unlock() }
        let instanceId = nextInstanceId
        nextInstanceId += 1
        sources[nativeId] = Entry(
            sharedSource: SharedSource(source: source, legacyInstanceId: instanceId, callback: callback),
            owner: ObjectIdentifier(owner),
            instanceId: instanceId
        )
        return instanceId
    }

    /**
     - Returns: The removed source and the instance id of its registration, or `nil` if `nativeId` was not registered.
     */
    @discardableResult
    static func unregister(nativeId: NativeId) -> (source: Source, instanceId: Int)? {
        lock.lock()
        defer { lock.unlock() }
        guard let entry = sources.removeValue(forKey: nativeId) else {
            return nil
        }
        return (source: entry.source, instanceId: entry.instanceId)
    }

    static func source(nativeId: NativeId) -> Source? {
        lock.lock()
        defer { lock.unlock() }
        return sources[nativeId]?.source
    }

    static func sharedSource(nativeId: NativeId) -> SharedSource? {
        lock.lock()
        defer { lock.unlock() }
        return sources[nativeId]?.sharedSource
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
