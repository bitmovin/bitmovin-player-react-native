// Fixed manifest bytes keep lifecycle tests independent of ad-server decisions.
// The media is the existing Bitmovin two-second integration-test asset.
const vastXml = `<VAST version="3.0">
  <Ad id="bitmovin-two-second-ad">
    <InLine>
      <AdSystem>Bitmovin Cavy fixture</AdSystem>
      <AdTitle>Two second ad</AdTitle>
      <Impression><![CDATA[https://bitmovin-player-eu-west1-ci-input.s3.amazonaws.com/general/ads/cavy-impression]]></Impression>
      <Creatives>
        <Creative>
          <Linear skipoffset="00:00:01">
            <Duration>00:00:02</Duration>
            <MediaFiles>
              <MediaFile delivery="progressive" type="video/mp4" width="640" height="360">
                https://cdn.bitmovin.com/content/internal/assets/testing/ads/testad2s.mp4
              </MediaFile>
            </MediaFiles>
          </Linear>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>`;

const linearXml = `<?xml version="1.0" encoding="UTF-8"?>\n${vastXml}`;

const linearAdTag = `data:application/xml;base64,${btoa(linearXml)}`;

const vmapXml = `<?xml version="1.0" encoding="UTF-8"?>
<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">
  <vmap:AdBreak breakId="pre" timeOffset="start" breakType="linear">
    <vmap:AdSource id="pre" allowMultipleAds="false" followRedirects="false">
      <vmap:AdTagURI templateType="vast3"><![CDATA[${linearAdTag}]]></vmap:AdTagURI>
    </vmap:AdSource>
  </vmap:AdBreak>
  <vmap:AdBreak breakId="mid" timeOffset="00:00:15" breakType="linear">
    <vmap:AdSource id="mid" allowMultipleAds="false" followRedirects="false">
      <vmap:AdTagURI templateType="vast3"><![CDATA[${linearAdTag}]]></vmap:AdTagURI>
    </vmap:AdSource>
  </vmap:AdBreak>
  <vmap:AdBreak breakId="post" timeOffset="end" breakType="linear">
    <vmap:AdSource id="post" allowMultipleAds="false" followRedirects="false">
      <vmap:AdTagURI templateType="vast3"><![CDATA[${linearAdTag}]]></vmap:AdTagURI>
    </vmap:AdSource>
  </vmap:AdBreak>
</vmap:VMAP>`;

const vmapAdTag = `data:application/xml;base64,${btoa(vmapXml)}`;

const bamVmapXml = `<?xml version="1.0" encoding="UTF-8"?>
<vmap:VMAP xmlns:vmap="http://www.iab.net/videosuite/vmap" version="1.0">
  <vmap:AdBreak breakId="pre" timeOffset="start" breakType="linear">
    <vmap:AdSource id="pre" allowMultipleAds="false" followRedirects="false">
      <vmap:VASTAdData>${vastXml}</vmap:VASTAdData>
    </vmap:AdSource>
  </vmap:AdBreak>
  <vmap:AdBreak breakId="mid" timeOffset="00:00:15" breakType="linear">
    <vmap:AdSource id="mid" allowMultipleAds="false" followRedirects="false">
      <vmap:VASTAdData>${vastXml}</vmap:VASTAdData>
    </vmap:AdSource>
  </vmap:AdBreak>
  <vmap:AdBreak breakId="post" timeOffset="end" breakType="linear">
    <vmap:AdSource id="post" allowMultipleAds="false" followRedirects="false">
      <vmap:VASTAdData>${vastXml}</vmap:VASTAdData>
    </vmap:AdSource>
  </vmap:AdBreak>
</vmap:VMAP>`;

module.exports = { linearXml, bamVmapXml, linearAdTag, vmapAdTag };
