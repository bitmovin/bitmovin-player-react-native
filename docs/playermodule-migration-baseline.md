# PlayerModule Migration Baseline Documentation

## Performance Metrics (Pre-Migration)

### Method Count
- **iOS PlayerModule**: 47 @objc/@ReactMethod methods
- **Android PlayerModule**: 43 @ReactMethod methods  
- **Total**: 90 methods requiring migration

### Complexity Metrics
- **iOS Lines**: 811 lines
- **Android Lines**: 628 lines
- **Total**: 1,439 lines of complex native code

### Dependencies
- **Registry Pattern**: Central player registry used by 10+ modules
- **Static Access Methods**: 
  - iOS: `PlayerModule.retrieve(_:)` 
  - Android: `PlayerModule.getPlayerOrNull()`
- **Thread Coordination**: UIManager.addUIBlock patterns throughout
- **Cross-Module Calls**: 13 dependent modules identified

### Threading Patterns
- **iOS**: Custom methodQueue using bridge.uiManager.methodQueue
- **Android**: UI thread resolution via TPromise wrapper
- **Memory Management**: Special IMA SDK compatibility in deinit

### Registry Usage Analysis
Files depending on player registry:
- iOS: 10 files (SourceModule, RNPlayerViewManager, OfflineModule, etc.)
- Android: 11 files (including DecoderConfigModule, RNPlayerViewPackage)

### Critical Static Methods
These methods MUST remain available during migration:
```swift
// iOS - Called by 8+ modules
@objc func retrieve(_ nativeId: NativeId) -> Player?
```

```kotlin
// Android - Called by 9+ modules  
fun getPlayerOrNull(nativeId: NativeId): Player?
```

## Migration Strategy

### Phase 3 Enhanced Process Requirements
1. ✅ **Performance Benchmarking**: Baseline documented above
2. 🔄 **Incremental Method Migration**: Migrate methods one at a time
3. 🔄 **Static Method Preservation**: Ensure cross-module compatibility
4. ⏳ **Integration Testing**: Verify all 13 dependent modules
5. ⏳ **Rollback Planning**: Per-method commit strategy

### Risk Mitigation
- **Dependency Mapping**: All 13 dependent modules identified
- **Threading Analysis**: UIManager patterns documented
- **Memory Patterns**: IMA SDK compatibility requirements noted
- **Registry Access**: Static method signatures preserved

### Success Criteria
1. All 90 methods migrated to Expo Modules API
2. 13 dependent modules continue working unchanged
3. Performance metrics maintained or improved
4. Zero breaking changes to public API
5. All builds and tests pass

## Implementation Notes

### Critical Preservation Requirements
- Registry<Player> pattern must be maintained
- Static access methods must remain available
- Threading patterns must be equivalent
- Memory management patterns must be preserved
- Cross-module dependency injection must work

### Expo Modules Adaptations Required
- Convert @ReactMethod to AsyncFunction/Function patterns
- Adapt UIManager.addUIBlock to Expo threading
- Convert promise patterns to throw/return patterns
- Maintain registry access for dependent modules
- Preserve event emission patterns

This baseline serves as the reference point for Phase 3 enhanced migration process.