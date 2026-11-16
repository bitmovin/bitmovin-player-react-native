const fs = require('node:fs');
const path = require('node:path');
const { linearXml, bamVmapXml } = require('../assets/fixtures/advertising');

const subtitleFixture = path.join(
  __dirname,
  '../assets/fixtures/positioned-webvtt'
);
const files = {
  'master.m3u8': 'application/vnd.apple.mpegurl',
  'video.m3u8': 'application/vnd.apple.mpegurl',
  'subtitles.m3u8': 'application/vnd.apple.mpegurl',
  'positioned.vtt': 'text/vtt; charset=utf-8',
  'video-0.mpegts': 'video/mp2t',
};
const responses = new Map(
  Object.entries(files).map(([name, contentType]) => [
    `/cavy-fixtures/positioned-webvtt/${name}`,
    { body: fs.readFileSync(path.join(subtitleFixture, name)), contentType },
  ])
);

responses.set('/cavy-fixtures/advertising/vast.xml', {
  body: Buffer.from(linearXml),
  contentType: 'application/xml; charset=utf-8',
});
responses.set('/cavy-fixtures/advertising/vmap.xml', {
  body: Buffer.from(bamVmapXml),
  contentType: 'application/xml; charset=utf-8',
});

// These fixtures share Metro's address so emulators use the same reachable host.
module.exports = function withFixtureMiddleware(middleware) {
  return (req, res, next) => {
    const pathname = req.url?.split('?')[0];
    const fixture = responses.get(pathname);
    if (fixture && (req.method === 'GET' || req.method === 'HEAD')) {
      if (pathname.startsWith('/cavy-fixtures/advertising/')) {
        console.info(
          '[Cavy fixture]',
          JSON.stringify({
            method: req.method,
            path: pathname,
            status: 200,
            bytes: fixture.body.length,
          })
        );
      }
      res.writeHead(200, {
        'Content-Type': fixture.contentType,
        'Content-Length': fixture.body.length,
        'Cache-Control': 'no-store',
      });
      res.end(req.method === 'HEAD' ? undefined : fixture.body);
      return;
    }
    if (
      req.method !== 'POST' ||
      pathname !== '/cavy-fixtures/drm/license-403'
    ) {
      return middleware(req, res, next);
    }

    // Discard the DRM challenge without collecting or logging its contents.
    req.resume();
    res.writeHead(403, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Length': Buffer.byteLength('Forbidden\n'),
      'Cache-Control': 'no-store',
    });
    res.end('Forbidden\n');
  };
};
