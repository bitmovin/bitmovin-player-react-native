#import <BitmovinPlayer/BitmovinPlayer.h>
#import <React/RCTConvert.h>

@interface RCTConvert (Bitmovin)

+ (BMPPlayerConfig *)BMPPlayerConfig:(id)json;
+ (BMPSourceConfig *)BMPSourceConfig:(id)json;

@end
