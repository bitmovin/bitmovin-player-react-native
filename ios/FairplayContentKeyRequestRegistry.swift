import BitmovinPlayer

/**
 * Registry for `FairplayContentKeyRequest` instances.
 *
 * `FairplayContentKeyRequest` wraps an `AVContentKeyRequest`, which is a native iOS/tvOS object
 * that cannot be serialized across the React Native bridge. This registry retains the native
 * instances so they can be retrieved when `renewExpiringLicense` is called from the JS layer
 * using only the `skdUri` string.
 *
 * Instances are keyed by a composite of the source's `NativeId` and the `skdUri` to prevent
 * collisions across multiple sources.
 */
internal final class FairplayContentKeyRequestRegistry {
    private var requests: [String: FairplayContentKeyRequest] = [:]
    private let lock = NSRecursiveLock()

    func store(nativeId: String, contentKeyRequest: FairplayContentKeyRequest) {
        lock.lock()
        defer { lock.unlock() }
        requests[key(nativeId: nativeId, skdUri: contentKeyRequest.skdUri)] = contentKeyRequest
    }

    func retrieve(nativeId: String, skdUri: String) -> FairplayContentKeyRequest? {
        lock.lock()
        defer { lock.unlock() }
        return requests[key(nativeId: nativeId, skdUri: skdUri)]
    }

    func removeAll(nativeId: String) {
        lock.lock()
        defer { lock.unlock() }
        requests = requests.filter { !$0.key.hasPrefix("\(nativeId)_") }
    }

    private func key(nativeId: String, skdUri: String) -> String {
        "\(nativeId)_\(skdUri)"
    }
}
