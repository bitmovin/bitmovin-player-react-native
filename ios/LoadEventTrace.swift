#if DEBUG
import BitmovinPlayer
import Foundation
import UIKit

/// Temporary native diagnostics. Never serialize an SDK object or event payload here.
internal enum LoadEventTrace {
    private static let runtimeId = UUID().uuidString
    private static let lock = NSLock()
    private static var sourceIds: [ObjectIdentifier: NativeId] = [:]
    private static var playerIds: [ObjectIdentifier: NativeId] = [:]

    static func register(_ source: Source, nativeId: NativeId) {
        lock.lock()
        sourceIds[ObjectIdentifier(source)] = nativeId
        lock.unlock()
    }

    static func bind(_ source: Source, playerId: NativeId) {
        lock.lock()
        playerIds[ObjectIdentifier(source)] = playerId
        lock.unlock()
    }

    static func remove(_ source: Source) {
        lock.lock()
        sourceIds.removeValue(forKey: ObjectIdentifier(source))
        playerIds.removeValue(forKey: ObjectIdentifier(source))
        lock.unlock()
    }

    static func source(for event: Event, player: Player) -> Source? {
        switch event {
        case let event as SourceLoadEvent:
            return event.source
        case let event as SourceLoadedEvent:
            return event.source
        case let event as SourceUnloadedEvent:
            return event.source
        case is ReadyEvent:
            return player.source
        default:
            return nil
        }
    }

    static func recordUnloadEntry(playerId: NativeId) {
        let player = PlayerRegistry.getPlayer(nativeId: playerId)
        record("unload.entry", playerId: playerId, source: player?.source)
        if player == nil {
            record("unload.rejected.playerLookup", playerId: playerId)
        }
    }

    static func record(
        _ stage: String,
        playerId: NativeId? = nil,
        sourceId: NativeId? = nil,
        source: Source? = nil,
        event: Event? = nil,
        view: UIView? = nil
    ) {
        if let event,
           !(event is SourceLoadEvent || event is SourceLoadedEvent ||
             event is SourceUnloadedEvent || event is ReadyEvent) {
            return
        }
        let observedAt = Date().timeIntervalSince1970 * 1_000
        let monotonic = ProcessInfo.processInfo.systemUptime * 1_000
        var mappedSourceId: NativeId?
        var mappedPlayerId: NativeId?
        if let source {
            lock.lock()
            mappedSourceId = sourceIds[ObjectIdentifier(source)]
            mappedPlayerId = playerIds[ObjectIdentifier(source)]
            lock.unlock()
        }
        var values: [String: Any] = [
            "runtime": "ios",
            "runtimeId": runtimeId,
            "stage": stage,
            "observedAt": observedAt,
            "monotonicMs": monotonic,
            "isMainThread": Thread.isMainThread
        ]
        values["playerId"] = playerId ?? mappedPlayerId
        values["sourceId"] = sourceId ?? mappedSourceId
        if let source {
            values["sourceObjectId"] = String(describing: ObjectIdentifier(source))
            values["loadingState"] = source.loadingState.rawValue
            values["isActive"] = source.isActive
            values["isAttachedToPlayer"] = source.isAttachedToPlayer
        }
        if let event {
            values["event"] = event.name
            if event.timestamp.isFinite {
                values["eventTimestamp"] = event.timestamp
            }
        }
        if let view {
            values["viewId"] = String(describing: ObjectIdentifier(view))
            values["isAttachedToWindow"] = view.window != nil
        }
        guard let data = try? JSONSerialization.data(withJSONObject: values, options: [.sortedKeys]),
              let json = String(data: data, encoding: .utf8) else { return }
        print("[PRN_LOAD_TRACE] \(json)")
    }
}
#endif
