const withCorrelator =
  (tag: string): (() => string) =>
  () =>
    // Append a random correlator to the ad tag to ensure unique requests.
    // This is useful for testing purposes to avoid caching issues.
    `${tag}${Math.floor(Math.random() * 100000)}`;

export const AdTags = {
  vastSkippable: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dskippablelinear&correlator='
  ),
  vast1: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/single_ad_samples&ciu_szs=300x250&impl=s&gdfp_req=1&env=vp&output=vast&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ct%3Dlinear&correlator='
  ),
  vast2: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?slotname=/21775744923/external/vmap_ad_samples&sz=640x480&ciu_szs=300x250&cust_params=sample_ar%3Dpremidpostpod&url=&unviewed_position_start=1&output=xml_vast3&impl=s&env=vp&gdfp_req=1&ad_rule=0&cue=15000&vad_type=linear&vpos=midroll&pod=2&mridx=1&rmridx=1&ppos=1&min_ad_duration=0&max_ad_duration=30000&vrid=1270234&correlator=1231231&cmsid=496&video_doc_id=short_onecue&pied=CigKGkNLYmtqZGVMOWY4Q0ZaR1gzZ29kMHVBTjFBEgoIk-i0t7-0tJJ4&kfa=0&tfcd=0&correlator='
  ),
  vmapPreMidPost: withCorrelator(
    'https://pubads.g.doubleclick.net/gampad/ads?sz=640x480&iu=/124319096/external/ad_rule_samples&ciu_szs=300x250&ad_rule=1&impl=s&gdfp_req=1&env=vp&output=vmap&unviewed_position_start=1&cust_params=deployment%3Ddevsite%26sample_ar%3Dpremidpost&cmsid=496&vid=short_onecue&correlator='
  ),
  progressive:
    'https://cdn.bitmovin.com/content/internal/assets/testing/ads/testad2s.mp4',
  error: withCorrelator('https://mock.httpstatus.io/404?correlator='),
};
