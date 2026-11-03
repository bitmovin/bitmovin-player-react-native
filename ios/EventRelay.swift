import BitmovinPlayer
import Combine

/**
 * Subscribes to one native event type of `emitter` and passes its events to the given closure.
 */
internal typealias EventSubscriber<Emitter> = (Emitter, @escaping (any Event) -> Void) -> AnyCancellable

/**
 * Subscribes to the native events of an instance per event name on demand and forwards the received events via
 * `forward`. Must only be used from the main thread.
 *
 * Subscriptions are counted: the native subscription is made on the first subscription and cancelled once the last
 * one is gone. This is necessary when the app creates several JS instances (e.g. `Player`s) with the same
 * `nativeId`, which each subscribe and unsubscribe on their own.
 */
internal final class EventRelay<Emitter> {
    private final class Subscription {
        let cancellable: AnyCancellable
        var referenceCount = 1

        init(cancellable: AnyCancellable) {
            self.cancellable = cancellable
        }
    }

    private let subscribers: [String: EventSubscriber<Emitter>]
    private let forward: (NativeId, any Event) -> Void
    private var subscriptions: [NativeId: [String: Subscription]] = [:]

    /**
     * - Parameters:
     *   - subscribers: The supported event types, keyed by their React Native event name.
     *   - forward: Called with the `nativeId` of the emitting instance and the event.
     */
    init(subscribers: [String: EventSubscriber<Emitter>], forward: @escaping (NativeId, any Event) -> Void) {
        self.subscribers = subscribers
        self.forward = forward
    }

    /**
     * Subscribes to the `eventName` events of `emitter`. Does nothing if `emitter` is `nil`, e.g. because the native
     * instance was already destroyed, or if the event name is not supported.
     */
    func subscribe(nativeId: NativeId, emitter: Emitter?, eventName: String) {
        guard let emitter, let subscriber = subscribers[eventName] else {
            return
        }
        if let subscription = subscriptions[nativeId]?[eventName] {
            subscription.referenceCount += 1
            return
        }
        let cancellable = subscriber(emitter) { [weak self] event in
            self?.forward(nativeId, event)
        }
        subscriptions[nativeId, default: [:]][eventName] = Subscription(cancellable: cancellable)
    }

    func unsubscribe(nativeId: NativeId, eventName: String) {
        guard let subscription = subscriptions[nativeId]?[eventName] else {
            return
        }
        subscription.referenceCount -= 1
        guard subscription.referenceCount <= 0 else {
            return
        }
        subscription.cancellable.cancel()
        subscriptions[nativeId]?.removeValue(forKey: eventName)
        if subscriptions[nativeId]?.isEmpty == true {
            subscriptions.removeValue(forKey: nativeId)
        }
    }

    func unsubscribeAll(nativeId: NativeId) {
        subscriptions.removeValue(forKey: nativeId)?.values.forEach { $0.cancellable.cancel() }
    }

    /**
     * Cancels all native subscriptions.
     */
    func clear() {
        subscriptions.values.forEach { instanceSubscriptions in
            instanceSubscriptions.values.forEach { $0.cancellable.cancel() }
        }
        subscriptions.removeAll()
    }
}
