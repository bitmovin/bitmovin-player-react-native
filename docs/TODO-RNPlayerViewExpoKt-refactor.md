# RNPlayerViewExpo.kt Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan for `RNPlayerViewExpo.kt` to improve code quality, maintainability, and architecture while preserving all current functionality. The plan is based on detailed analysis identifying issues with class structure, method complexity, and separation of concerns.

**Note**: Automated testing setup and implementation is **out of scope** for this refactoring plan. The focus is on code structure improvements and manual validation. Setting up proper testing infrastructure would be a separate initiative.

## Current State Analysis

### Problems Identified

1. **Too Many Responsibilities**: The `RNPlayerViewExpo` class handles:
   - View management and layout
   - Player lifecycle management
   - Event forwarding (~60 EventDispatcher properties)
   - Complex UI state (fullscreen, Picture-in-Picture)
   - Android Activity lifecycle events
   - Background playback coordination

2. **Method Complexity**: Several methods are too long and handle multiple tasks:
   - `attachPlayer()` - 50+ lines handling player initialization, PiP setup, subtitles, and listeners
   - `onPictureInPictureModeChanged()` - Complex low-level view manipulation
   - `setPlayerView()` - Multiple responsibilities in view setup

3. **Code Duplication**:
   - Fullscreen state synchronization logic repeated in multiple places
   - `MATCH_PARENT` LayoutParams creation duplicated
   - PiP layout restoration logic scattered

4. **Testability Issues**:
   - Tight coupling with Android framework
   - Large monolithic class difficult to maintain
   - Complex dependencies on Expo modules

5. **Error Handling**:
   - Race conditions in `attachPlayer()` method
   - Inconsistent null handling patterns
   - Silent failures without proper logging

### Recently Fixed Issues

✅ **SubtitleView Integration Fixed** (2025-01-15):

- **Problem**: SubtitleView was not displaying on top of PlayerView due to incorrect parent container and missing layout parameters
- **Solution**: Modified `setSubtitleView()` to add SubtitleView to `playerContainer` instead of `ExpoView` with proper `FrameLayout.LayoutParams`
- **PiP Support**: Added SubtitleView resizing logic in `onPictureInPictureModeChanged()` for both entering and exiting PiP mode
- **Result**: SubtitleView now properly displays on top of PlayerView and resizes correctly during PiP transitions

## Refactoring Strategy

### Primary Goals

- **Separate concerns** into focused, single-responsibility classes
- **Improve maintainability** through dependency injection and modular design
- **Reduce complexity** by breaking down large methods
- **Eliminate code duplication** with helper functions
- **Enhance maintainability** with better naming and structure

### Architecture Overview

```
android/src/main/java/com/bitmovin/player/reactnative/
├── RNPlayerViewExpo.kt (refactored main class)
├── lifecycle/
│   └── PlayerViewLifecycleObserver.kt
├── pip/
│   └── PipManager.kt
├── events/
│   └── PlayerEventBridge.kt
└── utils/
    └── LayoutHelpers.kt
```

## Phase 1: Extract Helper Classes (High Priority)

### 1.1 PlayerViewLifecycleObserver.kt

**Purpose**: Extract all Android Activity lifecycle management logic from the main class.

**Responsibilities**:

- Handle `onStart`, `onStop`, `onResume`, `onPause` lifecycle events
- Manage background playback coordination
- Handle `playerInMediaSessionService` logic
- Coordinate with MediaSession for background audio

**Implementation Details**:

```kotlin
// File: lifecycle/PlayerViewLifecycleObserver.kt
class PlayerViewLifecycleObserver(
    private val appContext: AppContext,
    private val view: RNPlayerViewExpo
) : DefaultLifecycleObserver {

    private var playerInMediaSessionService: Player? = null

    override fun onStart(owner: LifecycleOwner) {
        // Move logic from current onStart implementation
        if (playerInMediaSessionService != null) {
            view.playerView?.player = playerInMediaSessionService
        }
        view.playerView?.onStart()
    }

    override fun onResume(owner: LifecycleOwner) {
        view.playerView?.onResume()
    }

    override fun onPause(owner: LifecycleOwner) {
        view.playerView?.onPause()
    }

    override fun onStop(owner: LifecycleOwner) {
        removePlayerForBackgroundPlayback()
        view.playerView?.onStop()
    }

    private fun removePlayerForBackgroundPlayback() {
        // Extract logic from current implementation
        if (view.enableBackgroundPlayback) {
            playerInMediaSessionService = view.playerView?.player
            view.playerView?.player = null
        }
    }

    fun cleanup() {
        playerInMediaSessionService = null
    }
}
```

**Integration in Main Class**:

```kotlin
// In RNPlayerViewExpo.kt
private lateinit var lifecycleObserver: PlayerViewLifecycleObserver

init {
    lifecycleObserver = PlayerViewLifecycleObserver(appContext, this)
    // Register with activity lifecycle
}
```

### 1.2 PipManager.kt

**Purpose**: Extract all Picture-in-Picture related logic into a dedicated manager class.

**Responsibilities**:

- Handle `onConfigurationChanged` events
- Manage PiP mode transitions (enter/exit)
- Calculate and apply PiP window dimensions
- Handle complex view layout updates during PiP
- Interact with WindowManager for PiP bounds

**Implementation Details**:

```kotlin
// File: pip/PipManager.kt
class PipManager(
    private val appContext: AppContext,
    private val view: RNPlayerViewExpo
) {

    private var isCurrentActivityInPictureInPictureMode = false

    fun onConfigurationChanged(newConfig: Configuration) {
        val wasInPiP = isCurrentActivityInPictureInPictureMode
        val nowInPiP = isInPictureInPictureMode()

        if (wasInPiP != nowInPiP) {
            isCurrentActivityInPictureInPictureMode = nowInPiP
            onPictureInPictureModeChanged(nowInPiP, newConfig)
        }
    }

    private fun onPictureInPictureModeChanged(
        isInPictureInPictureMode: Boolean,
        newConfig: Configuration
    ) {
        val playerView = view.playerView ?: return

        playerView.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)

        if (isInPictureInPictureMode) {
            enterPictureInPictureMode(playerView)
        } else {
            exitPictureInPictureMode(playerView)
        }
    }

    private fun enterPictureInPictureMode(playerView: PlayerView) {
        if (!playerView.isPictureInPicture) {
            playerView.enterPictureInPicture()
        }

        // Force layout updates
        playerView.requestLayout()
        view.requestLayout()

        // Apply PiP-specific layout handling
        applyPipLayout()
    }

    private fun exitPictureInPictureMode(playerView: PlayerView) {
        if (playerView.isPictureInPicture) {
            playerView.exitPictureInPicture()
        }

        // Restore full size layout
        restoreFullSizeLayout()
    }

    private fun applyPipLayout() {
        view.post {
            val activity = appContext.activityProvider?.currentActivity
            if (activity != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && activity.isInPictureInPictureMode) {
                val pipDimensions = calculatePipDimensions(activity)
                applyPipDimensions(pipDimensions.width, pipDimensions.height)
            }
        }
    }

    private fun calculatePipDimensions(activity: Activity): PipDimensions {
        val windowManager = activity.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val windowMetrics = windowManager.currentWindowMetrics
            val bounds = windowMetrics.bounds
            PipDimensions(bounds.width(), bounds.height())
        } else {
            val displayMetrics = DisplayMetrics()
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getMetrics(displayMetrics)
            PipDimensions(displayMetrics.widthPixels, displayMetrics.heightPixels)
        }
    }

    private fun applyPipDimensions(pipWidth: Int, pipHeight: Int) {
        // Extract current complex layout logic
        applyExpoViewDimensions(pipWidth, pipHeight)
        applyContainerDimensions(pipWidth, pipHeight)
        applyPlayerViewDimensions(pipWidth, pipHeight)

        // Force redraws
        view.playerView?.invalidate()
        view.playerContainer?.invalidate()
        view.invalidate()
    }

    private fun restoreFullSizeLayout() {
        view.post {
            // Extract current layout restoration logic
            restoreExpoViewDimensions()
            restoreContainerDimensions()
            restorePlayerViewDimensions()

            // Force layout updates
            forceLayoutUpdate()
        }
    }

    private data class PipDimensions(val width: Int, val height: Int)

    // Additional helper methods for dimension management...
}
```

### 1.3 PlayerEventBridge.kt

**Purpose**: Extract event listener management and reduce boilerplate in the main class.

**Responsibilities**:

- Manage all player event listeners (~60 EventDispatcher properties)
- Handle event attachment and detachment
- Provide clean interface for event management
- Reduce main class complexity

**Implementation Details**:

```kotlin
// File: events/PlayerEventBridge.kt
class PlayerEventBridge(
    private val eventCallbacks: PlayerEventCallbacks
) {

    private var playerEventSubscriptions = mutableListOf<EventSubscription<*>>()

    fun attachPlayerListeners(playerView: PlayerView) {
        // Extract all current event listener logic
        attachPlayerEvents(playerView)
        attachSourceEvents(playerView)
        attachUIEvents(playerView)
    }

    private fun attachPlayerEvents(playerView: PlayerView) {
        playerView.on(PlayerEvent.Ready::class) {
            eventCallbacks.onBmpReady(it.toJson())
        }

        playerView.on(PlayerEvent.Play::class) {
            eventCallbacks.onBmpPlay(it.toJson())
        }

        // ... continue for all player events
    }

    private fun attachSourceEvents(playerView: PlayerView) {
        playerView.on(SourceEvent.Loaded::class) {
            eventCallbacks.onBmpSourceLoaded(it.toJson())
        }

        // ... continue for all source events
    }

    private fun attachUIEvents(playerView: PlayerView) {
        playerView.on(PlayerEvent.FullscreenEnabled::class) {
            eventCallbacks.onBmpFullscreenEnabled(it.toJson())
        }

        // ... continue for all UI events
    }

    fun detachPlayerListeners() {
        playerEventSubscriptions.forEach { it.dispose() }
        playerEventSubscriptions.clear()
    }
}

// Data class to hold all event callbacks
data class PlayerEventCallbacks(
    val onBmpReady: (String) -> Unit,
    val onBmpPlay: (String) -> Unit,
    val onBmpPause: (String) -> Unit,
    // ... all other event callbacks
)
```

## Phase 2: Method Refactoring (Medium Priority)

### 2.1 Break Down attachPlayer() Method

**Current Issues**:

- 50+ lines handling multiple responsibilities
- Complex initialization logic
- Difficult to maintain and extend

**Refactoring Strategy**:

```kotlin
// Current single method becomes:
fun attachPlayer(
    playerId: NativeId,
    playerViewConfigWrapper: RNPlayerViewConfigWrapper?,
    enableBackgroundPlayback: Boolean,
    isPictureInPictureEnabledOnPlayer: Boolean,
    userInterfaceTypeName: String?
) {
    val player = getPlayerOrReturn(playerId) ?: return

    if (isPlayerAlreadyAttached(player)) return

    detachCurrentPlayer()

    val playerView = initializePlayerView(player, playerViewConfigWrapper, userInterfaceTypeName)
    initializeSubtitleView(player)
    setupPictureInPicture(player, playerView, isPictureInPictureEnabledOnPlayer, playerViewConfigWrapper)

    attachPlayerToView(player, playerView)
    updateBackgroundPlaybackSetting(enableBackgroundPlayback)
}

private fun getPlayerOrReturn(playerId: NativeId): Player? {
    val playerModule = appContext.registry.getModule<PlayerExpoModule>()
    return playerModule?.getPlayerOrNull(playerId).also { player ->
        if (player == null) {
            Log.w("RNPlayerViewExpo", "Player not found for id: $playerId")
        }
    }
}

private fun isPlayerAlreadyAttached(player: Player): Boolean {
    return playerView?.player == player
}

private fun initializePlayerView(
    player: Player,
    config: RNPlayerViewConfigWrapper?,
    userInterfaceTypeName: String?
): PlayerView {
    val activity = appContext.activityProvider?.currentActivity
    return PlayerView(activity, player, config?.playerViewConfig).apply {
        layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
        userInterfaceTypeName?.let {
            userInterfaceType = it.toUserInterfaceType()
        }
    }
}

private fun setupPictureInPicture(
    player: Player,
    playerView: PlayerView,
    isPictureInPictureEnabledOnPlayer: Boolean,
    config: RNPlayerViewConfigWrapper?
) {
    val isPictureInPictureEnabled = isPictureInPictureEnabledOnPlayer ||
        config?.pictureInPictureConfig?.isEnabled == true

    if (isPictureInPictureEnabled) {
        val currentActivity = appContext.activityProvider?.currentActivity
        playerView.setPictureInPictureHandler(
            RNPictureInPictureHandler(currentActivity, player)
        )
    }
}
```

### 2.2 Break Down setPlayerView() Method

**Refactoring Strategy**:

```kotlin
private fun setPlayerView(playerView: PlayerView) {
    removeExistingPlayerView()
    removeExistingContainer()

    val container = createPlayerContainer()
    addPlayerViewToContainer(playerView, container)
    addContainerToExpoView(container)

    updatePlayerViewReferences(playerView, container)
    applyPendingConfiguration(playerView)
}

private fun createPlayerContainer(): FrameLayout {
    return FrameLayout(context).apply {
        layoutParams = FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
    }
}

private fun addPlayerViewToContainer(playerView: PlayerView, container: FrameLayout) {
    (playerView.parent as? ViewGroup)?.removeView(playerView)
    container.addView(playerView, FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.MATCH_PARENT
    ))
}

private fun addContainerToExpoView(container: FrameLayout) {
    val containerLayoutParams = generateDefaultLayoutParams()
    containerLayoutParams.width = ViewGroup.LayoutParams.MATCH_PARENT
    containerLayoutParams.height = ViewGroup.LayoutParams.MATCH_PARENT
    addView(container, 0, containerLayoutParams)
}
```

## Phase 3: Helper Functions and Utilities (Medium Priority)

### 3.1 Layout Helpers

**Purpose**: Eliminate code duplication for common layout operations.

```kotlin
// File: utils/LayoutHelpers.kt
object LayoutHelpers {

    fun createMatchParentLayoutParams(): FrameLayout.LayoutParams {
        return FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT,
            FrameLayout.LayoutParams.MATCH_PARENT
        )
    }

    fun createLayoutParams(width: Int, height: Int): FrameLayout.LayoutParams {
        return FrameLayout.LayoutParams(width, height)
    }

    fun forceViewLayout(view: View, width: Int, height: Int) {
        view.measure(
            View.MeasureSpec.makeMeasureSpec(width, View.MeasureSpec.EXACTLY),
            View.MeasureSpec.makeMeasureSpec(height, View.MeasureSpec.EXACTLY)
        )
        view.layout(0, 0, width, height)
    }

    fun restoreViewToFullSize(view: View, parentWidth: Int, parentHeight: Int) {
        view.layoutParams?.let { params ->
            params.width = ViewGroup.LayoutParams.MATCH_PARENT
            params.height = ViewGroup.LayoutParams.MATCH_PARENT
            view.layoutParams = params
        }
        forceViewLayout(view, parentWidth, parentHeight)
    }
}
```

### 3.2 Fullscreen State Management

**Purpose**: Eliminate duplication between `setFullscreen()` and `attachFullscreenBridge()`.

```kotlin
// In RNPlayerViewExpo.kt
private fun syncFullscreenState() {
    val isFullscreen = isFullscreenRequested ?: return
    val playerView = this.playerView ?: return

    if (playerView.isFullscreen != isFullscreen) {
        if (isFullscreen) {
            playerView.enterFullscreen()
        } else {
            playerView.exitFullscreen()
        }
    }
}

fun setFullscreen(isFullscreen: Boolean) {
    isFullscreenRequested = isFullscreen
    syncFullscreenState()
}

fun attachFullscreenBridge(fullscreenBridgeId: NativeId) {
    this.fullscreenBridgeId = fullscreenBridgeId
    syncFullscreenState() // Reuse the same logic
}
```

## Phase 4: Naming Conventions and Error Handling (Low Priority)

### 4.1 Improved Naming Conventions

**Current** → **Improved**:

- `playerInMediaSessionService` → `backgroundPlayer`
- `requestedFullscreenValue` → `isFullscreenRequested`
- `requestedPictureInPictureValue` → `isPictureInPictureRequested`
- `isCurrentActivityInPictureInPictureMode` → `wasInPictureInPictureMode`

### 4.2 Enhanced Error Handling

**Race Condition Handling**:

```kotlin
private fun attachPlayer(playerId: NativeId, ...) {
    val playerModule = appContext.registry.getModule<PlayerExpoModule>()
    val player = playerModule?.getPlayerOrNull(playerId)

    if (player == null) {
        Log.w("RNPlayerViewExpo", "Player not ready for id: $playerId, deferring attachment")
        // TODO: Implement queueing mechanism for better handling
        return
    }

    // Continue with attachment...
}
```

**Consistent Null Handling**:

```kotlin
private fun safePlayerOperation(operation: (PlayerView) -> Unit) {
    playerView?.let { playerView ->
        try {
            operation(playerView)
        } catch (e: Exception) {
            Log.e("RNPlayerViewExpo", "Error in player operation", e)
        }
    } ?: Log.w("RNPlayerViewExpo", "PlayerView is null, skipping operation")
}
```

## Phase 5: Updated Main Class Structure

### 5.1 Refactored RNPlayerViewExpo.kt

```kotlin
@SuppressLint("ViewConstructor")
class RNPlayerViewExpo(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

    // Core components
    var playerView: PlayerView? = null
        private set
    private var subtitleView: SubtitleView? = null
    private var playerContainer: FrameLayout? = null

    // Helper classes
    private lateinit var lifecycleObserver: PlayerViewLifecycleObserver
    private lateinit var pipManager: PipManager
    private lateinit var eventBridge: PlayerEventBridge

    // Configuration state
    var enableBackgroundPlayback: Boolean = false
    private var scalingMode: ScalingMode? = null
    private var isFullscreenRequested: Boolean? = null
    private var isPictureInPictureRequested: Boolean? = null
    private var fullscreenBridgeId: NativeId? = null

    // Event dispatchers (managed by eventBridge)
    private val eventCallbacks = PlayerEventCallbacks(
        onBmpReady = { onBmpReady(it) },
        onBmpPlay = { onBmpPlay(it) },
        // ... all other callbacks
    )

    init {
        setupHelperClasses()
        setupLifecycleObserver()
    }

    private fun setupHelperClasses() {
        lifecycleObserver = PlayerViewLifecycleObserver(appContext, this)
        pipManager = PipManager(appContext, this)
        eventBridge = PlayerEventBridge(eventCallbacks)
    }

    // Simplified public API
    fun attachPlayer(playerId: NativeId, ...) { /* Refactored implementation */ }
    fun setFullscreen(isFullscreen: Boolean) { /* Simplified implementation */ }
    fun setPictureInPicture(isPictureInPicture: Boolean) { /* Simplified implementation */ }

    // Lifecycle delegation
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        pipManager.onConfigurationChanged(newConfig)
    }

    // Cleanup
    override fun onDestroy() {
        super.onDestroy()
        eventBridge.detachPlayerListeners()
        lifecycleObserver.cleanup()
        // ... rest of cleanup
    }
}
```

## Implementation Timeline

### Phase 1 (Week 1-2): Core Extraction

- [ ] Create `PlayerViewLifecycleObserver.kt`
- [ ] Create `PipManager.kt`
- [ ] Create `PlayerEventBridge.kt`
- [ ] Validate each component functionality

### Phase 2 (Week 3): Method Refactoring

- [ ] Refactor `attachPlayer()` method
- [ ] Refactor `setPlayerView()` method
- [ ] Manual testing of new methods

### Phase 3 (Week 4): Utilities and Helpers

- [ ] Create `LayoutHelpers.kt`
- [ ] Implement `syncFullscreenState()` helper
- [ ] Eliminate remaining code duplication

### Phase 4 (Week 5): Polish and Integration

- [ ] Apply naming convention improvements
- [ ] Enhance error handling
- [ ] Update main class to use helper classes
- [ ] Manual validation

### Phase 5 (Week 6): Manual Validation and Documentation

- [ ] Manual integration testing
- [ ] Performance validation
- [ ] Manual regression testing
- [ ] Documentation updates

## Success Metrics

### Quantitative Metrics:

- **Line Count Reduction**: From ~650 lines to ~300-400 lines in main class
- **Method Complexity**: No method over 30 lines
- **Manual Validation**: All helper classes manually tested
- **Cyclomatic Complexity**: Reduced by 40%

### Qualitative Metrics:

- **Single Responsibility**: Each class has one clear purpose
- **Maintainability**: All major components have clear interfaces
- **Maintainability**: New features can be added without modifying multiple classes
- **Readability**: Code is self-documenting with clear naming

## Risk Mitigation

### Technical Risks:

1. **Functionality Regression**: Manual testing at each phase
2. **Performance Impact**: Benchmark before/after refactoring
3. **Integration Issues**: Incremental integration with existing codebase

### Mitigation Strategies:

1. **Feature Flags**: Implement new classes alongside existing code
2. **Gradual Migration**: Phase-by-phase replacement
3. **Manual Testing**: Thorough manual testing of all functionality
4. **Code Reviews**: Peer review at each phase

**Note**: Automated testing infrastructure is not available and is out of scope for this refactoring. All validation will be done through manual testing and code review processes.

## Post-Refactoring Benefits

### For Development:

- **Faster Development**: Clear separation of concerns
- **Easier Debugging**: Isolated components
- **Better Structure**: Well-organized components
- **Reduced Bugs**: Simpler, more focused code

### For Maintenance:

- **Easier Onboarding**: Self-documenting code structure
- **Safer Changes**: Isolated impact of modifications
- **Better Documentation**: Clear component boundaries
- **Future-Proof**: Extensible architecture

## Conclusion

This refactoring plan transforms `RNPlayerViewExpo.kt` from a monolithic class into a well-structured, maintainable component system. The phased approach ensures minimal risk while maximizing benefits for long-term code health and developer productivity.

The key to success is maintaining 100% backward compatibility while systematically improving the internal architecture. Each phase builds upon the previous one, creating a robust foundation for future development.
