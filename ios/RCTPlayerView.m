#import "RCTPlayerView.h"
#import "RCTConvert+Bitmovin.h"
#import <React/RCTLog.h>

@implementation RCTPlayerView

- (instancetype)init
{
  #pragma clang diagnostic push
  #pragma clang diagnostic ignored "-Wnonnull"
  self = [super initWithPlayer:nil frame:CGRectZero];
  #pragma clang diagnostic pop
  if (self) {
    self.autoresizingMask =
      UIViewAutoresizingFlexibleWidth
    | UIViewAutoresizingFlexibleHeight;
  }
  return self;
}

- (void)loadConfig:(id)json
{
  BMPPlayerConfig *playerConfig = [RCTConvert BMPPlayerConfig:json];
  BMPSourceConfig *sourceConfig = [RCTConvert BMPSourceConfig:json];

  id<BMPPlayer> player = [BMPPlayerFactory createWithPlayerConfig:playerConfig];
  [self setPlayer:player];

  [player loadSourceConfig:sourceConfig];
}

- (void)dispose:(NSNumber *)tag
{
  if (![self.player isDestroyed]) {
    [self.player destroy];
  } else {
    RCTLogWarn(@"RCTPlayerView #%@ is already disposed.", tag);
  }
}

@end
