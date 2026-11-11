import { linearAdTag, vmapAdTag } from './AdFixtures';

let correlator = Date.now();
const withCorrelator = (tag: string): string => `${tag}${correlator++}`;

export const AdTags = {
  vastSkippable: linearAdTag,
  vast1: linearAdTag,
  vast2: linearAdTag,
  vmapPreMidPost: vmapAdTag,
  progressive:
    'https://cdn.bitmovin.com/content/internal/assets/testing/ads/testad2s.mp4',
  get pause(): string {
    return withCorrelator(
      'https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/nonlinear_ad_samples&sz=480x70&cust_params=sample_ct%3Dnonlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&correlator='
    );
  },
  error:
    'https://bitmovin-player-eu-west1-ci-input.s3.amazonaws.com/general/ads/notfound.mp4',
};
