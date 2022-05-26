#import "RNPlayerView.h"
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import <BitmovinPlayer/BitmovinPlayer.h>

@interface RNPlayerViewManager : RCTViewManager

@end

@implementation RNPlayerViewManager

RCT_EXPORT_MODULE(NativePlayerView)

- (UIView *)view
{
  return [[RNPlayerView alloc] init];
}

RCT_EXPORT_METHOD(loadConfig:(nonnull NSNumber *)reactTag config:(id)json)
{
  [self viewForTag:reactTag completion:^(RNPlayerView *view) {
    [view loadConfig:json];
  }];
}

RCT_EXPORT_METHOD(dispose:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(RNPlayerView *view) {
    [view dispose:reactTag];
  }];
}

- (void)viewForTag:(nonnull NSNumber *)reactTag completion:(void (^)(RNPlayerView *))completion
{
  [self.bridge.uiManager addUIBlock:^(RCTUIManager *uiManager, NSDictionary<NSNumber *, UIView *> *viewRegistry) {
    UIView *view = viewRegistry[reactTag];
    if (!view || ![view isKindOfClass:[RNPlayerView class]]) {
      RCTLogError(@"Cannot find PlayerView with tag #%@", reactTag);
      return;
    }
    completion((RNPlayerView *)view);
  }];
}

@end
