#if canImport(GoogleInteractiveMediaAds) && os(iOS)
import BitmovinPlayer
import GoogleInteractiveMediaAds
import UIKit

/// Wraps the Google IMA DAI (Dynamic Ad Insertion) flow for a Bitmovin Player.
/// Requests the stream from IMA, bridges playback via BitmovinVideoDisplay, and falls back to fallbackUrl on error.
internal final class IMAAdsWrapper: NSObject {
    private var streamManager: IMAStreamManager?
    private var adsLoader: IMAAdsLoader?
    private var pendingRequestedAssetId: String?
    private var adDisplayContainer: IMAAdDisplayContainer?
    private var fallbackUrl: String?
    private var adTagParams: [String: String]?
    private weak var player: Player?
    private var bitmovinVideoDisplay: BitmovinVideoDisplay?

    init(player: Player) {
        self.player = player
        super.init()
    }

    func setAdUiContainer(_ adUiContainer: UIView) {
        guard adDisplayContainer == nil else {
            return
        }

        guard adUiContainer.window != nil else {
            // View not in window yet (e.g. attachPlayer ran before layout). RNPlayerView will
            // call assignAdContainer again from layoutSubviews when the view has a window.
            return
        }

        guard let viewController = Self.findViewController(for: adUiContainer) else {
            print("[Bitmovin IMA] Unable to determine view controller for ad UI container")
            return
        }

        adDisplayContainer = IMAAdDisplayContainer(
            adContainer: adUiContainer,
            viewController: viewController,
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
            print("[Bitmovin IMA] AdsLoader is not initialized, storing assetId for later")
            pendingRequestedAssetId = assetId
            return
        }

        pendingRequestedAssetId = nil
        guard let streamRequest = buildStreamRequest(assetId: assetId) else {
            loadFallbackUrl()
            return
        }
        adsLoader.requestStream(with: streamRequest)
    }

    func setFallbackUrl(_ url: String?) {
        fallbackUrl = url
    }

    func setAdTagParams(_ params: [String: Any]?) {
        guard let params else {
            adTagParams = nil
            return
        }
        adTagParams = params.compactMapValues { $0 as? String }
    }
}

// MARK: - Private helpers

private extension IMAAdsWrapper {
    func loadFallbackUrl() {
        guard let player,
              let fallbackUrl,
              let url = URL(string: fallbackUrl) else {
            return
        }
        print("[Bitmovin IMA] Loading fallback URL: \(url)")
        let sourceConfig = SourceConfig(url: url, type: .hls)
        player.load(sourceConfig: sourceConfig)
    }

    func createAdsLoader() {
        guard adsLoader == nil else {
            print("[Bitmovin IMA] AdsLoader already created, skipping")
            return
        }
        guard let adDisplayContainer else {
            print("[Bitmovin IMA] Ad display container is not available")
            return
        }
        guard let player else {
            print("[Bitmovin IMA] Player is not available")
            return
        }
        print("Bitmovin IMA: createAdsLoader")

        let settings = IMASettings()
        bitmovinVideoDisplay = BitmovinVideoDisplay(player: player)
        adsLoader = IMAAdsLoader(settings: settings)
        adsLoader?.delegate = self
    }

    func buildStreamRequest(assetId: String) -> IMAStreamRequest? {
        guard let adDisplayContainer,
              let bitmovinVideoDisplay else {
            print("[Bitmovin IMA] Ad display container or video display not available, falling back to content URL")
            return nil
        }
        print("Bitmovin IMA: buildStreamRequest")
        let request = IMALiveStreamRequest(
            assetKey: assetId,
            adDisplayContainer: adDisplayContainer,
            videoDisplay: bitmovinVideoDisplay,
            userContext: nil
        )
        if let adTagParams, !adTagParams.isEmpty {
            request.adTagParameters = adTagParams
        }
        return request
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
        print("[Bitmovin IMA] Ad load error: \(adErrorData.adError.message ?? "Unknown")")
        loadFallbackUrl()
    }
}

// MARK: - IMAStreamManagerDelegate

extension IMAAdsWrapper: IMAStreamManagerDelegate {
    func streamManager(_ streamManager: IMAStreamManager, didReceive event: IMAAdEvent) {
        switch event.type {
        case .AD_BREAK_STARTED:
            print("[Bitmovin IMA] Event: AD_BREAK_STARTED")
        case .AD_BREAK_ENDED:
            print("[Bitmovin IMA] Event: AD_BREAK_ENDED")
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
        print("[Bitmovin IMA] Stream manager error: \(error.message ?? "Unknown")")
        loadFallbackUrl()
    }
}

// MARK: - View controller resolution

private extension IMAAdsWrapper {
    static func findViewController(for view: UIView) -> UIViewController? {
        if let nearest = view.nearestViewController {
            return topViewController(from: nearest)
        }
        let window: UIWindow? = view.window
            ?? UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .filter { $0.activationState == .foregroundActive }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }
        guard let root = window?.rootViewController else { return nil }
        return topViewController(from: root)
    }

    static func topViewController(from root: UIViewController?) -> UIViewController? {
        guard var current = root else { return nil }
        while true {
            if let presented = current.presentedViewController {
                current = presented
            } else if let nav = current as? UINavigationController, let visible = nav.visibleViewController {
                current = visible
            } else if let tab = current as? UITabBarController, let selected = tab.selectedViewController {
                current = selected
            } else if let page = current as? UIPageViewController, let first = page.viewControllers?.first {
                current = first
            } else {
                break
            }
        }
        return current
    }
}

private extension UIView {
    var nearestViewController: UIViewController? {
        var responder: UIResponder? = self
        while let current = responder {
            if let controller = current as? UIViewController { return controller }
            responder = current.next
        }
        return nil
    }
}
#endif
