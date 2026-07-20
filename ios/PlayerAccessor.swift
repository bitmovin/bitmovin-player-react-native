import BitmovinPlayer

/// Stable read-only interop API for optional companion packages that need to resolve
/// a native Bitmovin Player from a React Native Player.nativeId.
public enum PlayerAccessor {
    public static func retrieve(_ nativeId: NativeId) -> Player? {
        PlayerRegistry.getPlayer(nativeId: nativeId)
    }
}
