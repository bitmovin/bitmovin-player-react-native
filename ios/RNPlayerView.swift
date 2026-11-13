import BitmovinPlayer
@_spi(ExperimentalApi)
import BitmovinPlayerCore
import ExpoModulesCore

public class RNPlayerView: ExpoView {
    var playerView: PlayerView? {
        willSet {
            playerView?.removeFromSuperview()
            avPlayerViewControllerTransitionForced = false
            newValue?.autoresizingMask = [
                .flexibleWidth,
                .flexibleHeight
            ]
        }
        didSet {
            guard let playerView else {
                return
            }
            addSubview(playerView)
            maybeFixAVPlayerViewControllerVisibility()
            playerView.fullscreenHandler = fullscreenHandler?.handler
            if let scalingMode {
                playerView.scalingMode = scalingMode
            }
            if let requestedFullscreenValue {
                setFullscreenRequested(isFullscreen: requestedFullscreenValue)
            }
            if let requestedPictureInPictureValue {
                setPictureInPicture(enterPictureInPicture: requestedPictureInPictureValue)
            }
            if let isPictureInPictureEnabledValue {
                playerView.pictureInPicture.isEnabled = isPictureInPictureEnabledValue
            }
            if let pictureInPictureActions {
                updatePictureInPictureActions(actions: pictureInPictureActions)
            }
        }
    }

    private var customMessageHandler: SharedCustomMessageHandler?
    private var sharedPlayer: SharedPlayer?
    private var playerViewConfigWrapper: RNPlayerViewConfig?
    private var fullscreenHandler: SharedFullscreenHandler?
    private var scalingMode: ScalingMode?
    private var requestedFullscreenValue: Bool?
    private var requestedPictureInPictureValue: Bool?
    private var isPictureInPictureEnabledValue: Bool?
    private var pictureInPictureActions: [RNPictureInPictureAction]?
    private var avPlayerViewControllerTransitionForced = false
    private var foregroundObserver: NSObjectProtocol?

    let onBmpPlayerViewReady = EventDispatcher()
    let onBmpViewAttached = EventDispatcher()
    let onBmpPictureInPictureAvailabilityChanged = EventDispatcher()
    let onBmpPictureInPictureEnter = EventDispatcher()
    let onBmpPictureInPictureEntered = EventDispatcher()
    let onBmpPictureInPictureExit = EventDispatcher()
    let onBmpPictureInPictureExited = EventDispatcher()
    let onBmpFullscreenEnabled = EventDispatcher()
    let onBmpFullscreenDisabled = EventDispatcher()
    let onBmpFullscreenEnter = EventDispatcher()
    let onBmpFullscreenExit = EventDispatcher()

    required init(appContext: AppContext? = nil) {
        super.init(appContext: appContext)
        clipsToBounds = true
    }

    deinit {
        if let foregroundObserver {
            NotificationCenter.default.removeObserver(foregroundObserver)
        }
    }

    override public func layoutSubviews() {
        super.layoutSubviews()
        maybeFixAVPlayerViewControllerVisibility()
    }

    override public func didMoveToWindow() {
        super.didMoveToWindow()
        if window != nil { onBmpViewAttached([:]) }
    }

    internal func attachBindings(
        owner: SharedPlayer,
        fullscreen: SharedFullscreenHandler?,
        messages: SharedCustomMessageHandler?,
        config: [String: Any]?
    ) throws {
        guard !(try owner.player).isDestroyed else {
            throw Exception(name: "DestroyedPlayer", description: "Cannot attach a destroyed player")
        }
        setSharedPlayer(owner)
        configurePlayer(playerViewConfig: RCTConvert.rnPlayerViewConfig(config?["playerViewConfig"]))
        setFullscreenHandler(fullscreen)
        setCustomMessageHandler(messages)
        attachConfiguredPlayer()
    }

    internal func setSharedPlayer(_ owner: SharedPlayer?) {
        guard sharedPlayer !== owner else { return }
        playerView?.player?.remove(listener: self)
        sharedPlayer = owner
    }

    internal func configurePlayer(
        playerViewConfig: RNPlayerViewConfig?
    ) {
        playerViewConfigWrapper = playerViewConfig
    }

    internal func detachSharedPlayer() {
        detachCurrentPlayer()
        sharedPlayer = nil
    }

    internal func attachConfiguredPlayer() {
        guard let owner = sharedPlayer, let player = try? owner.player, !player.isDestroyed else { return }
        if let playerView, let currentPlayer = playerView.player, currentPlayer === player {
            // Player is already attached to the PlayerView
            return
        }

        if let userInterfaceConfig = maybeCreateUserInterfaceConfig(
            styleConfig: player.config.styleConfig,
            playerViewConfig: playerViewConfigWrapper
        ) {
            player.config.styleConfig.userInterfaceConfig = userInterfaceConfig
        }

        let previousPictureInPictureAvailableValue = playerView?.isPictureInPictureAvailable ?? false
        if let playerView {
            playerView.player = player
        } else {
            self.playerView = PlayerView(
                player: player,
                frame: bounds,
                playerViewConfig: playerViewConfigWrapper?.playerViewConfig ?? PlayerViewConfig()
            )
        }

        player.add(listener: self)
        playerView?.add(listener: self)

        updateForegroundObserver(
            shouldExitOnForeground: playerViewConfigWrapper?.pictureInPictureConfig?.shouldExitOnForeground ?? false
        )

        self.maybeEmitPictureInPictureAvailabilityEvent(
            previousState: previousPictureInPictureAvailableValue
        )
        onBmpPlayerViewReady([:])
    }

    internal func setFullscreenHandler(_ handler: SharedFullscreenHandler?) {
        fullscreenHandler = handler
        playerView?.fullscreenHandler = handler?.handler
    }

    internal func setCustomMessageHandler(_ handler: SharedCustomMessageHandler?) {
        customMessageHandler = handler
    }

    internal func setFullscreenRequested(isFullscreen: Bool) {
        guard let playerView else {
            requestedFullscreenValue = isFullscreen
            return
        }

        requestedFullscreenValue = nil
        guard playerView.isFullscreen != isFullscreen else {
            return
        }

        if isFullscreen {
            playerView.enterFullscreen()
        } else {
            playerView.exitFullscreen()
        }
    }

    internal func setPictureInPicture(enterPictureInPicture: Bool) {
        guard let playerView else {
            requestedPictureInPictureValue = enterPictureInPicture
            return
        }
        requestedPictureInPictureValue = nil
        guard playerView.isPictureInPicture != enterPictureInPicture else {
            return
        }
        if enterPictureInPicture {
            playerView.enterPictureInPicture()
        } else {
            playerView.exitPictureInPicture()
        }
    }

    internal func setScalingMode(scalingMode: String?) {
        switch scalingMode {
        case "Zoom":
            self.scalingMode = .zoom
        case "Stretch":
            self.scalingMode = .stretch
        case "Fit":
            self.scalingMode = .fit
        default:
            self.scalingMode = .fit
        }
        guard let playerView, let nativeScalingMode = self.scalingMode else {
            return
        }
        playerView.scalingMode = nativeScalingMode
    }

    internal func updatePictureInPictureActions(actions: [RNPictureInPictureAction]?) {
        guard let actions else {
            return
        }
        pictureInPictureActions = actions
        guard let playerView else { return }
#if os(iOS)
        playerView.pictureInPicture.showSkipControls = actions.contains(.seek)
        playerView.tweaks.hidePlaybackControlsInPictureInPicture = !actions.contains(.togglePlayback)
#endif
    }

    internal func setIsPictureInPictureEnabled(_ isEnabled: Bool) {
        isPictureInPictureEnabledValue = isEnabled
        playerView?.pictureInPicture.isEnabled = isEnabled
    }
}

private extension RNPlayerView {
    func detachCurrentPlayer() {
        guard let playerView else {
            return
        }
        playerView.player?.remove(listener: self)
        playerView.remove(listener: self)
        playerView.player = nil
        updateForegroundObserver()
    }

    func updateForegroundObserver(shouldExitOnForeground: Bool = false) {
        if let foregroundObserver {
            NotificationCenter.default.removeObserver(foregroundObserver)
            self.foregroundObserver = nil
        }
        guard shouldExitOnForeground else { return }
#if os(iOS)
        foregroundObserver = NotificationCenter.default.addObserver(
            forName: UIApplication.didBecomeActiveNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            guard let self, self.playerView?.isPictureInPicture == true else { return }
            self.playerView?.exitPictureInPicture()
        }
#endif
    }
}

extension RNPlayerView: PlayerListener {
    public func onDestroy(_ event: DestroyEvent, player: Player) { detachSharedPlayer() }
}

extension RNPlayerView: UserInterfaceListener {
    public func onPictureInPictureEnter(_ event: PictureInPictureEnterEvent, view: PlayerView) {
        onBmpPictureInPictureEnter(event.eventPayload())
    }

    public func onPictureInPictureEntered(_ event: PictureInPictureEnteredEvent, view: PlayerView) {
        onBmpPictureInPictureEntered(event.eventPayload())
    }

    public func onPictureInPictureExit(_ event: PictureInPictureExitEvent, view: PlayerView) {
        onBmpPictureInPictureExit(event.eventPayload())
    }

    public func onPictureInPictureExited(_ event: PictureInPictureExitedEvent, view: PlayerView) {
        onBmpPictureInPictureExited(event.eventPayload())
    }

    public func onFullscreenEnter(_ event: FullscreenEnterEvent, view: PlayerView) {
        onBmpFullscreenEnter(event.eventPayload())
    }

    public func onFullscreenExit(_ event: FullscreenExitEvent, view: PlayerView) {
        onBmpFullscreenExit(event.eventPayload())
    }

    public func onFullscreenEnabled(_ event: FullscreenEnabledEvent, view: PlayerView) {
        onBmpFullscreenEnabled(event.eventPayload())
    }

    public func onFullscreenDisabled(_ event: FullscreenDisabledEvent, view: PlayerView) {
        onBmpFullscreenDisabled(event.eventPayload())
    }
}

private extension RNPlayerView {
    /// This method is used to fix the visibility issue of `AVPlayerViewController` when it is presented on iOS 17
    /// or earlier when using the new architecture.
    func maybeFixAVPlayerViewControllerVisibility() {
#if RCT_NEW_ARCH_ENABLED
        guard !avPlayerViewControllerTransitionForced,
              let avPlayerViewController = AVPlayerViewController.findAVPlayerViewController(in: window) else {
            return
        }
        avPlayerViewControllerTransitionForced = true
        avPlayerViewController.beginAppearanceTransition(true, animated: false)
        avPlayerViewController.endAppearanceTransition()
#endif
    }

    func maybeCreateUserInterfaceConfig(
        styleConfig: StyleConfig,
        playerViewConfig: RNPlayerViewConfig?
    ) -> UserInterfaceConfig? {
        #if os(iOS)
        if styleConfig.userInterfaceType == .bitmovin {
            let bitmovinUserInterfaceConfig = styleConfig
                .userInterfaceConfig as? BitmovinUserInterfaceConfig ?? BitmovinUserInterfaceConfig()

            if let uiConfig = playerViewConfig?.uiConfig {
                bitmovinUserInterfaceConfig
                    .playbackSpeedSelectionEnabled = uiConfig.playbackSpeedSelectionEnabled
                bitmovinUserInterfaceConfig.uiManagerFactoryFunction = uiConfig.uiManagerFactoryFunction
                bitmovinUserInterfaceConfig.enableWebViewInspecting = uiConfig.enableWebViewInspecting
            }
            if let hideFirstFrame = playerViewConfig?.hideFirstFrame {
                bitmovinUserInterfaceConfig.hideFirstFrame = hideFirstFrame
            }

            bitmovinUserInterfaceConfig.customMessageHandler = customMessageHandler?.customMessageHandler

            return bitmovinUserInterfaceConfig
        }
        #endif
        if styleConfig.userInterfaceType == .system {
            let systemUserInterfaceConfig = styleConfig
                .userInterfaceConfig as? SystemUserInterfaceConfig ?? SystemUserInterfaceConfig()

            if let hideFirstFrame = playerViewConfig?.hideFirstFrame {
                systemUserInterfaceConfig.hideFirstFrame = hideFirstFrame
            }

            return systemUserInterfaceConfig
        }

        return nil
    }

    @MainActor
    func maybeEmitPictureInPictureAvailabilityEvent(previousState: Bool) {
        guard let playerView, playerView.isPictureInPictureAvailable != previousState else {
            return
        }
        let event: [String: Any] = [
            "isPictureInPictureAvailable": playerView.isPictureInPictureAvailable,
            "name": "onPictureInPictureAvailabilityChanged",
            "timestamp": Date().timeIntervalSince1970
        ]

        onBmpPictureInPictureAvailabilityChanged(event)
    }
}

private extension UIViewController {
    func findChildViewController(matching check: (UIViewController) -> Bool) -> UIViewController? {
        if check(self) {
            return self
        }
        for child in children {
            if check(child) {
                return child
            }
            if let found = child.findChildViewController(matching: check) {
                return found
            }
        }
        return nil
    }
}

private extension AVPlayerViewController {
    static func findAVPlayerViewController(in window: UIWindow?) -> AVPlayerViewController? {
        guard let avPlayerViewController = window?
            .rootViewController?
            .findChildViewController(matching: { $0 is AVPlayerViewController }) as? AVPlayerViewController else {
                return nil
        }
        return avPlayerViewController
    }
}
