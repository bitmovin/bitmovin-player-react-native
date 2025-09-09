import BitmovinPlayer
import Combine
import GoogleInteractiveMediaAds

// MARK: - IMAAdsWrapper
internal class IMAAdsWrapper: NSObject {
    private var streamManager: IMAStreamManager?
    private var adsLoader: IMAAdsLoader?
    private var pendingRequestedAssetId: String?
    private var adDisplayContainer: IMAAdDisplayContainer?
    private var fallbackUrl: String?
    private weak var player: Player?
    private var bitmovinVideoDisplay: BitmovinVideoDisplay?
    private var cancellables = Set<AnyCancellable>()

    init(player: Player) {
        self.player = player
        super.init()
    }

    func setAdUiContainer(_ adUiContainer: UIView) {
        guard adDisplayContainer == nil else {
            print("Ad display container already initialized, skipping setup")
            return
        }

        guard adUiContainer.window != nil else {
            print("Ad UI container is not attached to a window, cannot initialize ad display container")
            return
        }

        guard let adUiContainerViewController = Self.findViewController(for: adUiContainer) else {
            print("Unable to determine a view controller for ad UI container")
            return
        }

        self.adDisplayContainer = IMAAdDisplayContainer(
            adContainer: adUiContainer,
            viewController: adUiContainerViewController,
            companionSlots: nil
        )

        createAdsLoader()

        if let assetId = pendingRequestedAssetId {
            pendingRequestedAssetId = nil
            requestAndLoadStream(assetId)
        }
    }

    func requestAndLoadStream(_ assetId: String) {
        guard let adsLoader else {
            print("AdsLoader is not initialized")
            pendingRequestedAssetId = assetId
            return
        }

        pendingRequestedAssetId = nil
        let streamRequest = buildStreamRequest(assetId)
        adsLoader.requestStream(with: streamRequest)
    }

    func setFallbackUrl(_ url: String?) {
        fallbackUrl = url
    }
}

private extension IMAAdsWrapper {
    func loadFallbackUrl() {
        guard let player,
              let fallbackUrl,
              let url = URL(string: fallbackUrl),
              let sourceConfig = SourceConfig(url: url) else {
            return
        }

        player.load(sourceConfig: sourceConfig)
        player.play()
    }

    func createAdsLoader() {
        guard adsLoader == nil else {
            print("AdsLoader already created, skipping initialization")
            return
        }

        guard let adDisplayContainer else {
            print("Ad display container is not available")
            return
        }

        guard let player else {
            print("Player is not available")
            return
        }

        let settings = IMASettings()
        bitmovinVideoDisplay = BitmovinVideoDisplay(player: player)

        adsLoader = IMAAdsLoader(settings: settings)
        adsLoader?.delegate = self
    }

    func buildStreamRequest(_ assetId: String) -> IMAStreamRequest {
        // TODO: Add support for VOD streams by creating IMAVODStreamRequest
        guard let adDisplayContainer, let bitmovinVideoDisplay else {
            fatalError("Ad display container or video display not available")
        }
        return IMALiveStreamRequest(
            assetKey: assetId,
            adDisplayContainer: adDisplayContainer,
            videoDisplay: bitmovinVideoDisplay,
            userContext: nil
        )
    }
}

// MARK: - IMAAdsLoaderDelegate
extension IMAAdsWrapper: IMAAdsLoaderDelegate {
    func adsLoader(_ loader: IMAAdsLoader, adsLoadedWith adsLoadedData: IMAAdsLoadedData) {
        streamManager = adsLoadedData.streamManager
        streamManager?.delegate = self
        let adsRenderingSettings = IMAAdsRenderingSettings()
        streamManager?.initialize(with: adsRenderingSettings)
    }

    func adsLoader(_ loader: IMAAdsLoader, failedWith adErrorData: IMAAdLoadingErrorData) {
        print("IMA Ad Error: \(adErrorData.adError.message ?? "Unknown error")")

        loadFallbackUrl()
    }
}

// MARK: - IMAStreamManagerDelegate
extension IMAAdsWrapper: IMAStreamManagerDelegate {
    func streamManager(_ streamManager: IMAStreamManager, didReceive event: IMAAdEvent) {
        switch event.type {
        case .AD_BREAK_STARTED:
            // TODO: emit event?
            print("Event: AD_BREAK_STARTED")
        case .AD_BREAK_ENDED:
            // TODO: emit event?
            print("Event: AD_BREAK_ENDED")
        case .AD_PERIOD_STARTED:
            // TODO: emit event?
            break
        case .AD_PERIOD_ENDED:
            // TODO: emit event?
            break
        case .TAPPED:
            guard let player else { return }
            if player.isPlaying {
                player.pause()
            } else {
                player.play()
            }
        default:
            break
        }
    }

    func streamManager(_ streamManager: IMAStreamManager, didReceive error: IMAAdError) {
        print("IMA Stream Manager Ad Error: \(error.message ?? "Unknown error")")

        loadFallbackUrl()
    }
}

private extension UIView {
    /// Returns the nearest owning UIViewController by traversing the responder chain.
    var nearestViewController: UIViewController? {
        var responder: UIResponder? = self
        while let currentResponder = responder {
            if let viewController = currentResponder as? UIViewController { return viewController }
            responder = currentResponder.next
        }
        return nil
    }
}

private extension IMAAdsWrapper {
    /// Finds the appropriate VC for a given view:
    /// 1) nearest owning VC via responder chain
    /// 2) fallback to top-most VC in the same window/scene
    static func findViewController(for view: UIView) -> UIViewController? {
        if let viewController = view.nearestViewController {
            return topViewController(from: viewController)
        }

        // Fallback: resolve the window (scene-aware)
        let window: UIWindow? =
            view.window ??
            UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .filter { $0.activationState == .foregroundActive }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }

        guard let root = window?.rootViewController else { return nil }
        return topViewController(from: root)
    }

    /// Walks through presented / navigation / tab / page controllers to return the visible one.
    static func topViewController(from root: UIViewController?) -> UIViewController? {
        guard var current = root else { return nil }
        while true {
            if let presented = current.presentedViewController {
                current = presented
            } else if let nav = current as? UINavigationController,
                      let visible = nav.visibleViewController {
                current = visible
            } else if let tab = current as? UITabBarController,
                      let selected = tab.selectedViewController {
                current = selected
            } else if let page = current as? UIPageViewController,
                      let first = page.viewControllers?.first {
                current = first
            } else {
                break
            }
        }
        return current
    }
}
