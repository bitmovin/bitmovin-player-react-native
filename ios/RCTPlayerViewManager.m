#import "RCTPlayerView.h"
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import <BitmovinPlayer/BitmovinPlayer.h>

@interface RCTPlayerViewManager : RCTViewManager

@end

@implementation RCTPlayerViewManager

RCT_EXPORT_MODULE(NativePlayerView)

- (UIView *)view
{
  return [[RCTPlayerView alloc] init];
}

RCT_EXPORT_METHOD(loadConfig:(nonnull NSNumber *)reactTag config:(id)json)
{
  [self viewForTag:reactTag completion:^(RCTPlayerView *view) {
    [view loadConfig:json];
  }];
}

RCT_EXPORT_METHOD(dispose:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(RCTPlayerView *view) {
    [view dispose:reactTag];
  }];
}

- (void)viewForTag:(nonnull NSNumber *)reactTag completion:(void (^)(RCTPlayerView *))completion
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RCTPlayerView class]]) {
      RCTLogError(@"Cannot find PlayerView with tag #%@", reactTag);
      return;
    }
    completion((RCTPlayerView *)view);
  }];
}

@end
