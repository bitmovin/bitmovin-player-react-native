import BitmovinPlayer

extension RNPlayerView: PlayerListener {
    func onEvent(_ event: Event, player: Player) {
        onEvent?(event.toJSON())
    }

    func onPlayerActive(_ event: PlayerActiveEvent, player: Player) {
        onPlayerActive?(event.toJSON())
    }

    func onPlayerError(_ event: PlayerErrorEvent, player: Player) {
        onPlayerError?(event.toJSON())
    }

    func onPlayerWarning(_ event: PlayerWarningEvent, player: Player) {
        onPlayerWarning?(event.toJSON())
    }

    func onDestroy(_ event: DestroyEvent, player: Player) {
        onDestroy?(event.toJSON())
    }

    func onMuted(_ event: MutedEvent, player: Player) {
        onMuted?(event.toJSON())
    }

    func onUnmuted(_ event: UnmutedEvent, player: Player) {
        onUnmuted?(event.toJSON())
    }

    func onReady(_ event: ReadyEvent, player: Player) {
        onReady?(event.toJSON())
    }

    func onPaused(_ event: PausedEvent, player: Player) {
        onPaused?(event.toJSON())
    }

    func onPlay(_ event: PlayEvent, player: Player) {
        onPlay?(event.toJSON())
    }

    func onPlaying(_ event: PlayingEvent, player: Player) {
        onPlaying?(event.toJSON())
    }

    func onPlaybackFinished(_ event: PlaybackFinishedEvent, player: Player) {
        onPlaybackFinished?(event.toJSON())
    }

    func onSeek(_ event: SeekEvent, player: Player) {
        onSeek?(event.toJSON())
    }

    func onSeeked(_ event: SeekedEvent, player: Player) {
        onSeeked?(event.toJSON())
    }

    func onStallStarted(_ event: StallStartedEvent, player: Player) {
        onStallStarted?(event.toJSON())
    }

    func onStallEnded(_ event: StallEndedEvent, player: Player) {
        onStallEnded?(event.toJSON())
    }

    func onTimeChanged(_ event: TimeChangedEvent, player: Player) {
        onTimeChanged?(event.toJSON())
    }

    func onSourceLoad(_ event: SourceLoadEvent, player: Player) {
        onSourceLoad?(event.toJSON())
    }

    func onSourceLoaded(_ event: SourceLoadedEvent, player: Player) {
        onSourceLoaded?(event.toJSON())
    }

    func onSourceUnloaded(_ event: SourceUnloadedEvent, player: Player) {
        onSourceUnloaded?(event.toJSON())
    }

    func onSourceError(_ event: SourceErrorEvent, player: Player) {
        onSourceError?(event.toJSON())
    }

    func onSourceWarning(_ event: SourceWarningEvent, player: Player) {
        onSourceWarning?(event.toJSON())
    }

    func onAudioAdded(_ event: AudioAddedEvent, player: Player) {
        onAudioAdded?(event.toJSON())
    }

    func onAudioRemoved(_ event: AudioRemovedEvent, player: Player) {
        onAudioRemoved?(event.toJSON())
    }

    func onAudioChanged(_ event: AudioChangedEvent, player: Player) {
        onAudioChanged?(event.toJSON())
    }

    func onSubtitleAdded(_ event: SubtitleAddedEvent, player: Player) {
        onSubtitleAdded?(event.toJSON())
    }

    func onSubtitleRemoved(_ event: SubtitleRemovedEvent, player: Player) {
        onSubtitleRemoved?(event.toJSON())
    }

    func onSubtitleChanged(_ event: SubtitleChangedEvent, player: Player) {
        onSubtitleChanged?(event.toJSON())
    }

    func onVideoPlaybackQualityChanged(_ event: VideoDownloadQualityChangedEvent, player: Player) {
        onVideoPlaybackQualityChanged?(event.toJSON())
    }

    func onVideoSizeChanged(_ event: VideoSizeChangedEvent, player: Player) {
        onVideoSizeChanged?(event.toJSON())
    }

    func onDurationChanged(_ event: DurationChangedEvent, player: Player) {
        onDurationChanged?(event.toJSON())
    }

    // --- Temporary Ad Events --- //

    func onAdStarted(_ event: AdStartedEvent, player: Player) {
        onAdStarted?(event.toJSON())

        if (disableAdUi) {
            self.traverseHierarchy { responder, level in
                if(responder.description.range(of: "IMAWKWebView")) != nil {
                    let uiView = responder as? UIView
                    uiView?.isHidden = true
                }
            }
        }
    }

    func onAdFinished(_ event: AdFinishedEvent, player: Player) {
        onAdFinished?(event.toJSON())
    }

    func onAdQuartile(_ event: AdQuartileEvent, player: Player) {
        onAdQuartile?(event.toJSON())
    }

    func onAdBreakStarted(_ event: AdBreakStartedEvent, player: Player) {
        onAdBreakStarted?(event.toJSON())
    }

    func onAdBreakFinished(_ event: AdBreakFinishedEvent, player: Player) {
        onAdBreakFinished?(event.toJSON())
    }

    func onAdScheduled(_ event: AdScheduledEvent, player: Player) {
        onAdScheduled?(event.toJSON())
    }

    func onAdSkipped(_ event: AdSkippedEvent, player: Player) {
        onAdSkipped?(event.toJSON())
    }

    func onAdClicked(_ event: AdClickedEvent, player: Player) {
        onAdClicked?(event.toJSON())
    }

    func onAdError(_ event: AdErrorEvent, player: Player) {
        onAdError?(event.toJSON())
    }

    func onAdManifestLoad(_ event: AdManifestLoadEvent, player: Player) {
        onAdManifestLoad?(event.toJSON())
    }

    func onAdManifestLoaded(_ event: AdManifestLoadedEvent, player: Player) {
        onAdManifestLoaded?(event.toJSON())
    }
    
    /// Traverse a UIresponder's view hierarchy in the same way as the Debug View Hierarchy tool in Xcode.
    ///
    /// `traverseHierarchy` uses Depth First Search (DFS) to traverse the view hierarchy starting in the window. This way the method can traverse all sub-hierarchies in a correct order.
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
                    // For `UIViewController` object push it's view. Here the view is guaranteed to be loaded and in the window.
                    stack.append((responder: viewController.view, level: current.level + 1))

                default:
                    break
            }

            // Visit the current object
            visitor(current.responder, current.level)
        }
    }

}
