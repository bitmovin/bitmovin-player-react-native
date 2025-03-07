const withCorrelator = (tag: string): string =>
  `${tag}${Math.floor(Math.random() * 100000)}`;

export const AdTags = {
  vastSkippable: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dskippablelinear&correlator='
  ),
  vast1: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator='
  ),
  vast2: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?slotname=/124319096/external/ad_rule_samples&sz=640x480&ciu_szs=300x250&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpostpod&url=&unviewed_position_start=1&output=xml_vast3&impl=s&env=vp&gdfp_req=1&ad_rule=0&useragent=curl/7.71.1,gzip(gfe)&vad_type=linear&vpos=postroll&pod=1&ppos=1&lip=true&min_ad_duration=0&max_ad_duration=30000&vrid=6376&cmsid=496&video_doc_id=short_onecue&kfa=0&tfcd=0&correlator='
  ),
  vmapPreMidPost: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpost&cmsid=496&vid=short_onecue&correlator='
  ),
  progressive:
    'https://cdn.bitmovin.com/content/internal/assets/testing/ads/testad2s.mp4',
  error: withCorrelator('https://mock.codes/404?correlator='),
};
