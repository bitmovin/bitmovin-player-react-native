import BitmovinPlayer
import Combine
import Foundation

/**
 * Releases a `Source` via `release` once a `Player` removed it, e.g. via `PlaylistApi.remove`, `Player.unload`,
 * a later load or `Player.destroy`.
 *
 * The release is posted, so that the other listeners of the `SourceRemovedEvent` can still resolve the source.
 * Sources that are attached to a player again by then (e.g. reloaded) or kept via `keep(_:)` are not released.
 *
 * Must only be used on the main thread.
 */
internal final class RemovedSourceReleaser {
    private let release: (NativeId) -> Void
    private var subscriptions: [NativeId: AnyCancellable] = [:]
    private var pendingReleases = Set<ObjectIdentifier>()

    init(release: @escaping (NativeId) -> Void) {
        self.release = release
    }

    func attach(nativeId: NativeId, player: Player) {
        subscriptions[nativeId] = player.events
            .on(SourceRemovedEvent.self)
            .sink { [weak self] event in
                self?.scheduleRelease(event.source)
            }
    }

    func detach(nativeId: NativeId) {
        subscriptions.removeValue(forKey: nativeId)?.cancel()
    }

    /**
     * Keeps `source` if its release is pending, e.g. because it is initialized again right after it was removed.
     */
    func keep(_ source: Source) {
        pendingReleases.remove(Self.identifier(of: source))
    }

    /**
     * Cancels all subscriptions and drops pending releases.
     */
    func clear() {
        subscriptions.values.forEach { $0.cancel() }
        subscriptions.removeAll()
        pendingReleases.removeAll()
    }

    private func scheduleRelease(_ source: Source) {
        let identifier = Self.identifier(of: source)
        pendingReleases.insert(identifier)
        DispatchQueue.main.async { [weak self] in
            guard let self,
                  self.pendingReleases.remove(identifier) != nil,
                  !source.isAttachedToPlayer,
                  let nativeId = SourceRegistry.nativeId(of: source) else { return }
            self.release(nativeId)
        }
    }

    private static func identifier(of source: Source) -> ObjectIdentifier {
        ObjectIdentifier(source as AnyObject)
    }
}
