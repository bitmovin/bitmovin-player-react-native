import Foundation

/// A thread-safe manager that lets native code block until JavaScript
/// (or any other async source) supplies a result identified by an `Int` ID.
///
///     let (id, wait) = boolWaiter.make(timeout: 0.25)
///     sendEvent("…", ["id": id])
///     let answer = wait() ?? false   // falls back on timeout
///
internal final class ResultWaiter<Value> {
  // MARK: – private backing storage
  private struct Entry {
    let semaphore: DispatchSemaphore
    var value: Value?
  }

  private let queue = DispatchQueue(label: "ResultWaiter.storage", attributes: .concurrent)
  private var next: Int32 = 0
  private var table: [Int: Entry] = [:]

  /// Registers a new waiter and returns (id, waitClosure).
  /// `wait()` returns `nil` if the timeout elapses first.
  func make(timeout: TimeInterval) -> (id: Int, wait: () -> Value?) {
    let sema   = DispatchSemaphore(value: 0)
    let id     = Int(OSAtomicIncrement32(&next))

    // store entry
    queue.async(flags: .barrier) { self.table[id] = Entry(semaphore: sema, value: nil) }

    // closure that the caller will execute later
    let waitClosure = { [weak self] () -> Value? in
      _ = sema.wait(timeout: .now() + timeout)   // block caller’s thread
      guard let self else { return nil }
      defer { self.remove(id) }                  // clean-up once we’re done
      return self.value(for: id)
    }

    return (id, waitClosure)
  }

  /// Completes the waiter with `value`; no-ops if the ID is unknown.
  func complete(id: Int, with value: Value) {
    queue.async(flags: .barrier) {
      guard var entry = self.table[id] else { return }
      entry.value = value
      self.table[id] = entry
      entry.semaphore.signal()
    }
  }

  // MARK: – helpers ----------------------------------------------------------

  private func value(for id: Int) -> Value? {
    var value: Value?
    queue.sync { value = self.table[id]?.value }
    return value
  }

  private func remove(_ id: Int) {
    queue.async(flags: .barrier) { self.table[id] = nil }
  }
}
