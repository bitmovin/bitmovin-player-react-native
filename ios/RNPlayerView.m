#import "RNPlayerView.h"
#import "RCTConvert+Bitmovin.h"
#import <React/RCTLog.h>

@implementation RNPlayerView

- (instancetype)init
{
  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wnonnull"
  return [super initWithPlayer:nil frame:CGRectZero];
  #pragma clang diagnostic pop
}

- (void)loadConfig:(id)json
{
  BMPPlayerConfig *playerConfig = [RCTConvert BMPPlayerConfig:json];
  BMPSourceConfig *sourceConfig = [RCTConvert BMPSourceConfig:json];
  self.player = [BMPPlayerFactory createWithPlayerConfig:playerConfig];
  [self.player loadSourceConfig:sourceConfig];
}

- (void)destroy:(NSNumber *)tag
{
  if (!self.player.isDestroyed) {
    [self.player destroy];
  } else {
    RCTLogWarn(@"RCTPlayerView #%@ is already disposed.", tag);
  }
}

@end
