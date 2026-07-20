import BitmovinPlayer
import ExpoModulesCore
import Foundation
import RNBitmovinPlayer

public class GoogleDaiModule: Module {
    private var googleDaiPlayers: [NativeId: NativeId] = [:]
    private var playerOwners: [NativeId: NativeId] = [:]
    private var playerDestroyObservers: [NativeId: PlayerDestroyObserver] = [:]

    public func definition() -> ModuleDefinition {
        Name("GoogleDaiModule")

        OnDestroy { [weak self] in
            self?.playerDestroyObservers.values.forEach { $0.remove() }
            self?.googleDaiPlayers.removeAll()
            self?.playerOwners.removeAll()
            self?.playerDestroyObservers.removeAll()
        }

        AsyncFunction("initialize") { [weak self] (googleDaiId: NativeId, playerId: NativeId) in
            guard let self else { return }
            try self.initialize(
                googleDaiId: try nonEmptyNativeId(googleDaiId, field: "googleDaiId"),
                playerId: try nonEmptyNativeId(playerId, field: "playerId")
            )
        }.runOnQueue(.main)

        AsyncFunction("load") { [weak self] (googleDaiId: NativeId, sourceConfig: [String: Any]) in
            guard let self else { return }
            try self.load(
                googleDaiId: try nonEmptyNativeId(googleDaiId, field: "googleDaiId"),
                sourceConfig: sourceConfig
            )
        }.runOnQueue(.main)

        AsyncFunction("destroy") { [weak self] (googleDaiId: NativeId) in
            guard let self else { return }
            self.destroy(googleDaiId: try nonEmptyNativeId(googleDaiId, field: "googleDaiId"))
        }.runOnQueue(.main)
    }

    private func initialize(googleDaiId: NativeId, playerId: NativeId) throws {
        if let existingPlayerId = googleDaiPlayers[googleDaiId] {
            if existingPlayerId == playerId { return }
            throw googleDaiException(
                "DUPLICATE_GOOGLE_DAI_ID",
                "GoogleDai '\(googleDaiId)' is already initialized for another player."
            )
        }

        if playerOwners[playerId] != nil {
            throw googleDaiException(
                "DUPLICATE_PLAYER",
                "Player '\(playerId)' already has an active GoogleDai instance."
            )
        }

        guard let player = PlayerRegistry.getPlayer(nativeId: playerId) else {
            throw googleDaiException(
                "PLAYER_UNAVAILABLE",
                "Player '\(playerId)' is not initialized or has already been destroyed."
            )
        }

        googleDaiPlayers[googleDaiId] = playerId
        playerOwners[playerId] = googleDaiId
        observePlayerDestroy(googleDaiId: googleDaiId, player: player)
    }

    private func load(googleDaiId: NativeId, sourceConfig: [String: Any]) throws {
        guard googleDaiPlayers[googleDaiId] != nil else {
            throw googleDaiException(
                "UNKNOWN_GOOGLE_DAI_ID",
                "GoogleDai '\(googleDaiId)' is not initialized or has already been destroyed."
            )
        }
        _ = try liveSourceConfig(from: sourceConfig)
        throw googleDaiException(
            "IOS_GOOGLE_DAI_NOT_IMPLEMENTED",
            "The iOS Google DAI native SDK contract still needs SDK owner confirmation."
        )
    }

    private func observePlayerDestroy(googleDaiId: NativeId, player: Player) {
        playerDestroyObservers[googleDaiId]?.remove()
        let observer = PlayerDestroyObserver(player: player) { [weak self] in
            self?.destroy(googleDaiId: googleDaiId)
        }
        player.add(listener: observer)
        playerDestroyObservers[googleDaiId] = observer
    }

    private func destroy(googleDaiId: NativeId) {
        if let playerId = googleDaiPlayers.removeValue(forKey: googleDaiId) {
            playerOwners.removeValue(forKey: playerId)
        }
        playerDestroyObservers.removeValue(forKey: googleDaiId)?.remove()
    }
}

private final class PlayerDestroyObserver: NSObject, PlayerListener {
    private weak var player: Player?
    private let onDestroyPlayer: () -> Void

    init(player: Player, onDestroyPlayer: @escaping () -> Void) {
        self.player = player
        self.onDestroyPlayer = onDestroyPlayer
    }

    func remove() {
        player?.remove(listener: self)
        player = nil
    }

    func onDestroy(_ event: DestroyEvent, player: Player) {
        onDestroyPlayer()
    }
}

private struct LiveSourceConfig {
    let assetKey: String
    let type: String
    let apiKey: String?
    let networkCode: String?
    let adTagParameters: [String: String]
}

private func liveSourceConfig(from sourceConfig: [String: Any]) throws -> LiveSourceConfig {
    guard sourceConfig["kind"] as? String == "live" else {
        throw invalidSourceConfig("kind must be 'live'")
    }
    return LiveSourceConfig(
        assetKey: try nonEmptyString(sourceConfig["assetKey"], field: "assetKey"),
        type: try sourceType(sourceConfig["type"]),
        apiKey: try optionalString(sourceConfig["apiKey"], field: "apiKey"),
        networkCode: try optionalString(sourceConfig["networkCode"], field: "networkCode"),
        adTagParameters: try adTagParameters(sourceConfig["adTagParameters"])
    )
}

private func nonEmptyString(_ value: Any?, field: String) throws -> String {
    guard let string = value as? String,
          !string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        throw invalidSourceConfig("\(field) must be a non-empty string")
    }
    return string
}

private func optionalString(_ value: Any?, field: String) throws -> String? {
    guard let value, !(value is NSNull) else { return nil }
    guard let string = value as? String else {
        throw invalidSourceConfig("\(field) must be a string when provided")
    }
    return string
}

private func sourceType(_ value: Any?) throws -> String {
    guard let string = value as? String, ["dash", "hls"].contains(string) else {
        throw invalidSourceConfig("type must be 'dash' or 'hls'")
    }
    return string
}

private func adTagParameters(_ value: Any?) throws -> [String: String] {
    guard let value, !(value is NSNull) else { return [:] }
    guard let rawMap = value as? [String: Any] else {
        throw invalidSourceConfig("adTagParameters must be an object with string values")
    }
    return try rawMap.reduce(into: [:]) { result, entry in
        guard let stringValue = entry.value as? String else {
            throw invalidSourceConfig("adTagParameters must contain only string values")
        }
        result[entry.key] = stringValue
    }
}

private func nonEmptyNativeId(_ value: NativeId, field: String) throws -> NativeId {
    guard !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        throw googleDaiException("INVALID_NATIVE_ID", "\(field) must be a non-empty string.")
    }
    return value
}

private func invalidSourceConfig(_ reason: String) -> Exception {
    googleDaiException("INVALID_SOURCE_CONFIG", "Invalid Google DAI source config: \(reason).")
}

private func googleDaiException(_ code: String, _ description: String) -> Exception {
    Exception(name: code, description: description)
}
