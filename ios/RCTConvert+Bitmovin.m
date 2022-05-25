#import "RCTConvert+Bitmovin.h"

@implementation RCTConvert(Bitmovin)

RCT_ENUM_CONVERTER(
    BMPSourceType,
    (@{
      @"none": @(BMPSourceTypeNone),
      @"hls": @(BMPSourceTypeHls),
      @"dash": @(BMPSourceTypeDash),
      @"movpkg": @(BMPSourceTypeMovpkg),
      @"progressive": @(BMPSourceTypeProgressive),
    }),
    BMPSourceTypeNone,
    integerValue)

+ (BMPPlayerConfig *)BMPPlayerConfig:(id)json
{
  id configJson = json[@"player"];
  BMPPlayerConfig *config = [BMPPlayerConfig new];
  [config setKey:[RCTConvert NSString:configJson[@"licenseKey"]]];
  return config;
}

+ (BMPSourceConfig *)BMPSourceConfig:(id)json
{
  id configJson = json[@"source"];

  NSURL *url = [RCTConvert NSURL:configJson[@"url"]];
  BMPSourceType type = [RCTConvert BMPSourceType:configJson[@"type"]];
  BMPSourceConfig *config = [[BMPSourceConfig alloc] initWithUrl:url type:type];

  if (configJson[@"poster"]) {
    [config setPosterSource:[RCTConvert NSURL:configJson[@"poster"]]];
  }

  return config;
}

@end
