#import <Foundation/Foundation.h>
#import <BitmovinPlayer/BitmovinPlayer.h>

@interface RCTPlayerView : BMPPlayerView

- (instancetype)init;

- (void)loadConfig:(id)json;
- (void)dispose:(NSNumber *)tag;

@end
