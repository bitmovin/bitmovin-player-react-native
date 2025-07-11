import Foundation

/// A thread-safe manager that lets native code block until JavaScript
/// (or any other async source) supplies a result identified by an `Int` ID.
///
///     let (id, wait) = boolWaiter.make(timeout: 0.25)
///     sendEvent("…", ["id": id])
///     let answer = wait() ?? false   // falls back on timeout
///
final class ResultWaiter<Value> {

  // MARK: – private backing storage
  private struct Entry {
    let semaphore: DispatchSemaphore
    var value: Value?
  }

  private let q = DispatchQueue(label: "ResultWaiter.storage", attributes: .concurrent)
  private var next: Int32 = 0
  private var table: [Int : Entry] = [:]

  /// Registers a new waiter and returns (id, waitClosure).
  /// `wait()` returns `nil` if the timeout elapses first.
  func make(timeout: TimeInterval) -> (id: Int, wait: () -> Value?) {
    let sema   = DispatchSemaphore(value: 0)
    let id     = Int(OSAtomicIncrement32(&next))

    // store entry
    q.async(flags: .barrier) { self.table[id] = Entry(semaphore: sema, value: nil) }

    // closure that the caller will execute later
    let waitClosure = { [weak self] () -> Value? in
      _ = sema.wait(timeout: .now() + timeout)   // block caller’s thread
      guard let self = self else { return nil }
      defer { self.remove(id) }                  // clean-up once we’re done
      return self.value(for: id)
    }

    return (id, waitClosure)
  }

  /// Completes the waiter with `value`; no-ops if the ID is unknown.
  func complete(id: Int, with value: Value) {
    q.async(flags: .barrier) {
      guard var entry = self.table[id] else { return }
      entry.value = value
      self.table[id] = entry
      entry.semaphore.signal()
    }
  }

  // MARK: – helpers ----------------------------------------------------------

  private func value(for id: Int) -> Value? {
    var v: Value?
    q.sync { v = self.table[id]?.value }
    return v
  }

  private func remove(_ id: Int) {
    q.async(flags: .barrier) { self.table[id] = nil }
  }
}
