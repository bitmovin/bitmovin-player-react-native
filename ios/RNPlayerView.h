#import <Foundation/Foundation.h>
#import <BitmovinPlayer/BitmovinPlayer.h>

@interface RNPlayerView : BMPPlayerView

- (instancetype)init;

- (void)loadConfig:(id)json;
- (void)dispose:(NSNumber *)tag;

@end
