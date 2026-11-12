import BitmovinPlayer
import ExpoModulesCore

/// API handles retain the same owner and materialize its SDK only on main.
internal class SharedPlayerApi: SharedObject {
    let owner: SharedPlayer
    var player: Player { get throws { try owner.player } }
    init(owner: SharedPlayer) { self.owner = owner; super.init() }
}
internal final class SharedBufferApi: SharedPlayerApi {}
internal final class SharedAnalyticsApi: SharedPlayerApi {}
internal final class SharedMediaControlsApi: SharedPlayerApi {}
internal final class SharedPlaylistApi: SharedPlayerApi {}
