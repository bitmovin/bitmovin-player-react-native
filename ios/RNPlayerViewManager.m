#import "RCTConvert+Bitmovin.h"
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTViewManager.h>
#import <BitmovinPlayer/BitmovinPlayer.h>

@interface RNPlayerViewManager : RCTViewManager

@end

@implementation RNPlayerViewManager

RCT_EXPORT_MODULE(NativePlayerView)

- (UIView *)view
{
  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wnonnull"
  UIView *view = [[BMPPlayerView alloc] initWithPlayer:nil frame:CGRectZero];
  #pragma clang diagnostic pop
  view.autoresizingMask =
    UIViewAutoresizingFlexibleWidth
  | UIViewAutoresizingFlexibleHeight;
  return view;
}

RCT_EXPORT_METHOD(create:(nonnull NSNumber *)reactTag config:(id)json)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    if (view.player) {
      RCTLogWarn(@"PlayerView #%@ already has a player instance. It will get overwritten.", reactTag);
      view.player = nil;
    }
    BMPPlayerConfig *config = [RCTConvert BMPPlayerConfig:json];
    if (!config) {
      RCTLogError(@"Failed to create player configuration from json:\n%@", json);
      return;
    }
    view.player = [BMPPlayerFactory createWithPlayerConfig:config];
  }];
}

RCT_EXPORT_METHOD(loadSource:(nonnull NSNumber *)reactTag config:(id)json)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    BMPSourceConfig *config = [RCTConvert BMPSourceConfig:json];
    if (!config) {
      RCTLogError(@"Failed to create source configuration from json:\n%@", json);
      return;
    }
    [view.player loadSourceConfig:config];
  }];
}

RCT_EXPORT_METHOD(unload:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    [view.player unload];
  }];
}

RCT_EXPORT_METHOD(play:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    [view.player play];
  }];
}

RCT_EXPORT_METHOD(pause:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    [view.player pause];
  }];
}

RCT_EXPORT_METHOD(seek:(nonnull NSNumber *)reactTag time:(nonnull NSNumber *)time)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    [view.player seek:[time doubleValue]];
  }];
}

RCT_EXPORT_METHOD(mute:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    [view.player mute];
  }];
}

RCT_EXPORT_METHOD(unmute:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    [view.player unmute];
  }];
}

RCT_EXPORT_METHOD(destroy:(nonnull NSNumber *)reactTag)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    [view.player destroy];
  }];
}

RCT_EXPORT_METHOD(setVolume:(nonnull NSNumber *)reactTag volume:(nonnull NSNumber *)volume)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    view.player.volume = [volume integerValue];
  }];
}

RCT_EXPORT_METHOD(getVolume:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.volume)]);
  }];
}

RCT_EXPORT_METHOD(currentTime:(nonnull NSNumber *)reactTag mode:(id)mode callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    if (RCTNilIfNull(mode)) {
      BMPTimeMode timeMode = [RCTConvert BMPTimeMode:mode];
      callback(@[@([view.player currentTime:timeMode])]);
    } else {
      callback(@[@([view.player currentTime])]);
    }
  }];
}

RCT_EXPORT_METHOD(duration:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.duration)]);
  }];
}

RCT_EXPORT_METHOD(isDestroyed:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.isDestroyed)]);
  }];
}

RCT_EXPORT_METHOD(isMuted:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.isMuted)]);
  }];
}

RCT_EXPORT_METHOD(isPaused:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.isPaused)]);
  }];
}

RCT_EXPORT_METHOD(isPlaying:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.isPlaying)]);
  }];
}

RCT_EXPORT_METHOD(isLive:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.isLive)]);
  }];
}

RCT_EXPORT_METHOD(isAirPlayActive:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.isAirPlayActive)]);
  }];
}

RCT_EXPORT_METHOD(isAirPlayAvailable:(nonnull NSNumber *)reactTag callback:(RCTResponseSenderBlock)callback)
{
  [self viewForTag:reactTag completion:^(BMPPlayerView *view) {
    callback(@[@(view.player.isAirPlayAvailable)]);
  }];
}

- (void)viewForTag:(nonnull NSNumber *)reactTag completion:(void(^)(BMPPlayerView *view))completion
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
