// These fixtures share Metro's address so emulators use the same reachable host.
module.exports = function withFixtureMiddleware(middleware) {
  return (req, res, next) => {
    const pathname = req.url?.split('?')[0];
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
