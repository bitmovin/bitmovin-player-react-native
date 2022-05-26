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

- (void)setup:(NSNumber *)tag config:(id)json
{
  BMPPlayerConfig *config = [RCTConvert BMPPlayerConfig:json];
  self.player = [BMPPlayerFactory createWithPlayerConfig:config];
}

- (void)loadSource:(NSNumber *)tag config:(id)json
{
  if (!self.player) {
    RCTLogError(@"RNPlayerView #%@ has no player instance.", tag);
    return;
  }
  BMPSourceConfig *config = [RCTConvert BMPSourceConfig:json];
  [self.player loadSourceConfig:config];
}

- (void)destroy:(NSNumber *)tag
{
  if (!self.player) {
    RCTLogError(@"RNPlayerView #%@ has no player instance.", tag);
    return;
  }
  [self.player destroy];
}

@end
