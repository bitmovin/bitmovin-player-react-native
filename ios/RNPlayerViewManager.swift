import Foundation

@objc(RNPlayerViewManager)
public class RNPlayerViewManager: RCTViewManager {
  public override class func requiresMainQueueSetup() -> Bool {
    return true
  }

  /**
   Component's native view factory.
   */
  override public func view() -> UIView! {
    let view = RNPlayerView()
    view?.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    return view
  }

  /**
   Create a `Player` instance for `reactTag`'s view from `json`.
   
   - Parameter reactTag: Native view ID.
   - Parameter json: JS player configuration object.
   */
  @objc(create:json:)
  public func create(_ reactTag: NSNumber, json: Any?) {
    self.view(for: reactTag) { view in
      guard let playerConfig = RCTConvert.bmpPlayerConfig(json) else {
        Log.error("Failed to convert json into a BMPPlayerConfig:\njson -> \(json ?? "nil")")
        return
      }
      if (view.player != nil) {
        Log.warn("RNPlayerView #\(reactTag): Player instance is already created. It will get overwritten.")
        view.player = nil
      }
      view.player = PlayerFactory.create(playerConfig: playerConfig)
      view.addPlayerListener()
    }
  }

  /**
   Create a `SourceConfig` from `json` and load it into `reactTag`s player.

   - Parameter reactTag: Native view ID.
   - Parameter json: JS source configuration object.
   */
  @objc(loadSource:json:)
  public func loadSource(_ reactTag: NSNumber, json: Any?) {
    self.view(for: reactTag) { [weak self] view in
      guard let sourceConfig = RCTConvert.bmpSourceConfig(json) else {
        Log.error("RNPlayerView #\(reactTag): Failed to convert json into a BMPSourceConfig.\njson -> \(json ?? "nil")")
        return
      }
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.load(sourceConfig: sourceConfig)
    }
  }

  /**
   Unload `reactTag`'s player current source.

   - Parameter reactTag: Native view ID.
   */
  @objc(unload:)
  public func unload(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.unload()
    }
  }

  /**
   Start `reactTag`'s player.

   - Parameter reactTag: Native view ID.
   */
  @objc(play:)
  public func play(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.play()
    }
  }

  /**
   Pause `reactTag`'s player.

   - Parameter reactTag: Native view ID.
   */
  @objc(pause:)
  public func pause(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.pause()
    }
  }

  /**
   Move `reactTag`'s player cursor to the given time.

   - Parameter reactTag: Native view ID.
   */
  @objc(seek:time:)
  public func seek(_ reactTag: NSNumber, time: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.seek(time: time.doubleValue)
    }
  }

  /**
   Mute `reactTag`'s player.

   - Parameter reactTag: Native view ID.
   */
  @objc(mute:)
  public func mute(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.mute()
    }
  }

  /**
   Unmute `reactTag`'s player.

   - Parameter reactTag: Native view ID.
   */
  @objc(unmute:)
  public func unmute(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.unmute()
    }
  }

  /**
   Destroy `reactTag`'s player.

   - Parameter reactTag: Native view ID.
   */
  @objc(destroy:)
  public func destroy(_ reactTag: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      view.removePlayerListener()
      player.destroy()
      view.player = nil
    }
  }

  /**
   Set `reactTag`'s player volume.

   - Parameter reactTag: Native view ID.
   */
  @objc(setVolume:volume:)
  public func setVolume(_ reactTag: NSNumber, volume: NSNumber) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      player.volume = volume.intValue
    }
  }

  /**
   Get `reactTag`'s player volume.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(getVolume:resolver:rejecter:)
  public func getVolume(_ reactTag: NSNumber,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.volume)
    }
  }

  /**
   Get `reactTag`'s player source information.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(source:resolver:rejecter:)
  public func source(_ reactTag: NSNumber,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { view in
      guard let player = view.player, let source = player.source else {
        resolve(nil)
        return
      }
      resolve([
        "duration": source.duration,
        "isActive": source.isActive,
        "isAttachedToPlayer": source.isAttachedToPlayer,
        "loadingState": source.loadingState.rawValue,
        "metadata": source.metadata ?? NSNull()
      ])
    }
  }

  /**
   Get `reactTag`'s player current time.

   - Parameter reactTag: Native view ID.
   - Parameter mode: Time mode, either absolute or relative.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(currentTime:mode:resolver:rejecter:)
  public func currentTime(_ reactTag: NSNumber, mode: Any?,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      if let mode = mode {
        resolve(player.currentTime(RCTConvert.bmpTimeMode(mode)))
      } else {
        resolve(player.currentTime)
      }
    }
  }

  /**
   Get `reactTag`'s player source duration.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(duration:resolver:rejecter:)
  public func duration(_ reactTag: NSNumber,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.duration)
    }
  }
  
  /**
   Get `reactTag`'s player `isDestroyed` state.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isDestroyed:resolver:rejecter:)
  public func isDestroyed(_ reactTag: NSNumber,
                          resolver resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { view in
      guard let player = view.player else {
        resolve(true)
        return
      }
      resolve(player.isDestroyed)
    }
  }

  /**
   Get `reactTag`'s player `isMuted` state.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isMuted:resolver:rejecter:)
  public func isMuted(_ reactTag: NSNumber,
                      resolver resolve: @escaping RCTPromiseResolveBlock,
                      rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isMuted)
    }
  }

  /**
   Get `reactTag`'s player `isPlaying` state.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isPlaying:resolver:rejecter:)
  public func isPlaying(_ reactTag: NSNumber,
                        resolver resolve: @escaping RCTPromiseResolveBlock,
                        rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isPlaying)
    }
  }

  /**
   Get `reactTag`'s player `isPaused` state.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isPaused:resolver:rejecter:)
  public func isPaused(_ reactTag: NSNumber,
                       resolver resolve: @escaping RCTPromiseResolveBlock,
                       rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isPaused)
    }
  }

  /**
   Get `reactTag`'s player `isLive` state.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isLive:resolver:rejecter:)
  public func isLive(_ reactTag: NSNumber,
                     resolver resolve: @escaping RCTPromiseResolveBlock,
                     rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isLive)
    }
  }

  /**
   Get `reactTag`'s player `isAirPlayActive` state.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isAirPlayActive:resolver:rejecter:)
  public func isAirPlayActive(_ reactTag: NSNumber,
                              resolver resolve: @escaping RCTPromiseResolveBlock,
                              rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isAirPlayActive)
    }
  }

  /**
   Get `reactTag`'s player `isAirPlayAvailable` state.

   - Parameter reactTag: Native view ID.
   - Parameter resolver: JS promise resolver.
   - Parameter rejecter: JS promise rejecter.
   */
  @objc(isAirPlayAvailable:resolver:rejecter:)
  public func isAirPlayAvailable(_ reactTag: NSNumber,
                                 resolver resolve: @escaping RCTPromiseResolveBlock,
                                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    self.view(for: reactTag) { [weak self] view in
      guard let player = view.player else {
        self?.reportNilPlayer(reactTag)
        return
      }
      resolve(player.isAirPlayAvailable)
    }
  }

  /**
   Fetches the `RNPlayerView` associated with the `reactTag` received from react's `findNodeHandle`.

   - Parameter reactTag: Native view ID.
   - Parameter completion: UI callback receiving `RNPlayerView`.
   */
  private func view(for reactTag: NSNumber, completion: @escaping (RNPlayerView) -> Void) {
    self.bridge.uiManager.addUIBlock { _, viewsRegistry in
      guard
        let viewsRegistry = viewsRegistry,
        let view = viewsRegistry[reactTag] as? RNPlayerView
      else {
        Log.warn("Could not find RNPlayerView #\(reactTag) inside viewsRegistry.")
        return
      }
      completion(view)
    }
  }

  /**
   Helper function that encapsulates a common error message for nil player access.
   */
  private func reportNilPlayer(_ reactTag: NSNumber) {
    Log.error("RNPlayerView #\(reactTag): Tried to access an empty Player instance. Make sure to call .create() first.")
  }
}
