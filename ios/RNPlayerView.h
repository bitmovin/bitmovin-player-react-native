#import <Foundation/Foundation.h>
#import <BitmovinPlayer/BitmovinPlayer.h>

@interface RNPlayerView : BMPPlayerView

- (instancetype)init;

- (void)setup:(NSNumber *)tag config:(id)json;
- (void)loadSource:(NSNumber *)tag config:(id)json;
- (void)destroy:(NSNumber *)tag;

@end
