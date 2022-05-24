#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import <BitmovinPlayer/BitmovinPlayer.h>

@interface PlayerViewNativeComponentManager : RCTViewManager

@end

@implementation PlayerViewNativeComponentManager

RCT_EXPORT_MODULE(PlayerViewNativeComponent)

- (UIView *)view
{
  UIView *playerView = [[BMPPlayerView alloc] initWithPlayer:nil frame:CGRectZero];
  playerView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  return playerView;
}

RCT_EXPORT_METHOD(createPlayer:(nonnull NSNumber *)reactTag config:(id)json)
{
  [self addUIBlock:reactTag completion:^(BMPPlayerView *playerView) {
    BMPPlayerConfig *config = [BMPPlayerConfig new];
    if (json[@"key"]) {
      [config setKey:json[@"key"]];
    }
    id<BMPPlayer> player = [BMPPlayerFactory createWithPlayerConfig:config];
    [playerView setPlayer:player];
  }];
}

RCT_EXPORT_METHOD(destroyPlayer:(nonnull NSNumber *)reactTag)
{
  [self addUIBlock:reactTag completion:^(BMPPlayerView *playerView) {
    [playerView.player destroy];
  }];
}

- (void)addUIBlock:(NSNumber *)reactTag completion:(void (^)(BMPPlayerView *))completion
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[BMPPlayerView class]]) {
      RCTLogError(@"Cannot find PlayerView with tag #%@", reactTag);
      return;
    }
    completion((BMPPlayerView *)view);
  }];
}

@end
