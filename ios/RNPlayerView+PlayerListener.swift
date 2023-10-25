import BitmovinPlayer

extension RNPlayerView: PlayerListener {
    public func onEvent(_ event: Event, player: Player) {
        onEvent?(event.toJSON())
    }

    public func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        onPlayerActive?(event.toJSON())
    }

    public func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        onPlayerError?(event.toJSON())
    }

    public func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        onPlayerWarning?(event.toJSON())
    }

    public func onDestroy(_ event: DestroyEvent, player: Player) {
        onDestroy?(event.toJSON())
    }

    public func onMuted(_ event: MutedEvent, player: Player) {
        onMuted?(event.toJSON())
    }

    public func onUnmuted(_ event: UnmutedEvent, player: Player) {
        onUnmuted?(event.toJSON())
    }

    public func onReady(_ event: ReadyEvent, player: Player) {
        onReady?(event.toJSON())
    }

    public func onPaused(_ event: PausedEvent, player: Player) {
        onPaused?(event.toJSON())
    }

    public func onPlay(_ event: PlayEvent, player: Player) {
        onPlay?(event.toJSON())
    }

    public func onPlaying(_ event: PlayingEvent, player: Player) {
        onPlaying?(event.toJSON())
    }

    public func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        onPlaybackFinished?(event.toJSON())
    }

    public func onSeek(_ event: SeekEvent, player: Player) {
        onSeek?(event.toJSON())
    }

    public func onSeeked(_ event: SeekedEvent, player: Player) {
        onSeeked?(event.toJSON())
    }

    public func onTimeShift(_ event: TimeShiftEvent, player: Player) {
        onTimeShift?(event.toJSON())
    }

    public func onTimeShifted(_ event: TimeShiftedEvent, player: Player) {
        onTimeShifted?(event.toJSON())
    }

    public func onStallStarted(_ event: StallStartedEvent, player: Player) {
        onStallStarted?(event.toJSON())
    }

    public func onStallEnded(_ event: StallEndedEvent, player: Player) {
        onStallEnded?(event.toJSON())
    }

    public func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        onTimeChanged?(event.toJSON())
    }

    public func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        onSourceLoad?(event.toJSON())
    }

    public func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        onSourceLoaded?(event.toJSON())
    }

    public func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        onSourceUnloaded?(event.toJSON())
    }

    public func onSourceError(_ event: SourceErrorEvent, player: Player) {
        onSourceError?(event.toJSON())
    }

    public func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        onSourceWarning?(event.toJSON())
    }

    public func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        onAudioAdded?(event.toJSON())
    }

    public func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        onAudioRemoved?(event.toJSON())
    }

    public func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        onAudioChanged?(event.toJSON())
    }

    public func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        onSubtitleAdded?(event.toJSON())
    }

    public func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        onSubtitleRemoved?(event.toJSON())
    }

    public func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        onSubtitleChanged?(event.toJSON())
    }

    public func onVideoSizeChanged(_ event: VideoSizeChangedEvent, player: Player) {
        onVideoSizeChanged?(event.toJSON())
    }

    public func onDurationChanged(_ event: DurationChangedEvent, player: Player) {
        onDurationChanged?(event.toJSON())
    }

    public func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        onAdBreakFinished?(event.toJSON())
    }

    public func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        onAdBreakStarted?(event.toJSON())
    }

    public func onAdClicked(_ event: AdClickedEvent, player: Player) {
        onAdClicked?(event.toJSON())
    }

    public func onAdError(_ event: AdErrorEvent, player: Player) {
        onAdError?(event.toJSON())
    }

    public func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        onAdFinished?(event.toJSON())
    }

    public func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        onAdManifestLoad?(event.toJSON())
    }

    public func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        onAdManifestLoaded?(event.toJSON())
    }

    public func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        onAdQuartile?(event.toJSON())
    }

    public func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        onAdScheduled?(event.toJSON())
    }

    public func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        onAdSkipped?(event.toJSON())
    }

    public func onAdStarted(_ event: AdStartedEvent, player: Player) {
        onAdStarted?(event.toJSON())

        if disableAdUi {
            self.traverseHierarchy { responder, _ in
                if responder.description.contains("IMAWKWebView") {
                    let uiView = responder as? UIView
                    uiView?.isHidden = true
                }
            }
        }
    }

    public func onVideoPlaybackQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        onVideoPlaybackQualityChanged?(event.toJSON())
    }

#if os(iOS)
    public func onCastAvailable(_ event: CastAvailableEvent, player: Player) {
        onCastAvailable?(event.toJSON())
    }

    public func onCastPaused(_ event: CastPausedEvent, player: Player) {
        onCastPaused?(event.toJSON())
    }

    public func onCastPlaybackFinished(_ event: CastPlaybackFinishedEvent, player: Player) {
        onCastPlaybackFinished?(event.toJSON())
    }

    public func onCastPlaying(_ event: CastPlayingEvent, player: Player) {
        onCastPlaying?(event.toJSON())
    }

    public func onCastStarted(_ event: CastStartedEvent, player: Player) {
        onCastStarted?(event.toJSON())
    }

    public func onCastStart(_ event: CastStartEvent, player: Player) {
        onCastStart?(event.toJSON())
    }

    public func onCastStopped(_ event: CastStoppedEvent, player: Player) {
        onCastStopped?(event.toJSON())
    }

    public func onCastTimeUpdated(_ event: CastTimeUpdatedEvent, player: Player) {
        onCastTimeUpdated?(event.toJSON())
    }
    public func onCastWaitingForDevice(_ event: CastWaitingForDeviceEvent, player: Player) {
        onCastWaitingForDevice?(event.toJSON())
    }
#endif

    /// Traverse a UIresponder's view hierarchy in the same way as the Debug View Hierarchy tool in Xcode.
    ///
    ///
    /// - parameters:
    ///     - visitor: The closure executed for every view object in the hierarchy
    ///     - responder: The view object, `UIView`, `UIViewController`, or `UIWindow` instance.
    ///     - level: The depth level in the view hierarchy.
    ///
    /// `traverseHierarchy` uses Depth First Search (DFS) to traverse the view hierarchy starting in the window.
    ///     This way the method can traverse all sub-hierarchies in a correct order.
    ///
    /// - parameters:
    ///     - visitor: The closure executed for every view object in the hierarchy
    ///     - responder: The view object, `UIView`, `UIViewController`, or `UIWindow` instance.
    ///     - level: The depth level in the view hierarchy.
    func traverseHierarchy(_ visitor: (_ responder: UIResponder, _ level: Int) -> Void) {
        /// Stack used to accumulate objects to visit.
        var stack: [(responder: UIResponder, level: Int)] = [(responder: self, level: 0)]

        while !stack.isEmpty {
            let current = stack.removeLast()

            // Push objects to visit on the stack depending on the current object's type.
            switch current.responder {
            case let view as UIView:
                // For `UIView` object push subviews on the stack following next rules:
                //      - Exclude hidden subviews;
                //      - If the subview is the root view in the view controller - take the view controller instead.
                stack.append(contentsOf: view.subviews.reversed().compactMap {
                    $0.isHidden ? nil : (responder: $0.next as? UIViewController ?? $0, level: current.level + 1)
                })

            case let viewController as UIViewController:
                // For `UIViewController` object push it's view.
                // Here the view is guaranteed to be loaded and in the window.
                stack.append((responder: viewController.view, level: current.level + 1))

            default:
                break
            }

            // Visit the current object
            visitor(current.responder, current.level)
        }
    }
}
